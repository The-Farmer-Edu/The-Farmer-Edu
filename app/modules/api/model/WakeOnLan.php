<?php
/**
 * Wake-on-LAN helper.
 * Envia o magic packet via UDP broadcast.
 *
 * Uso:
 *   WakeOnLan::send('AA:BB:CC:DD:EE:FF');
 *   WakeOnLan::send('AA:BB:CC:DD:EE:FF', '192.168.1.255');                 // broadcast da sua sub-rede
 *   WakeOnLan::send('AA:BB:CC:DD:EE:FF', '192.168.1.255', [9, 7], '192.168.1.10'); // forçando a interface de saída
 */
class WakeOnLan {
    /**
     * @param string      $mac        MAC (ex.: "AA:BB:CC:DD:EE:FF")
     * @param string|null $broadcast  Broadcast da sua sub-rede (ex.: "192.168.1.255"). Opcional.
     * @param int[]       $ports      Portas UDP de destino
     * @param string|null $bindIp     IP local da interface que deve enviar (útil com várias placas/VPN)
     * @return bool true se ao menos um envio foi aceito pelo sistema operacional
     */
    public static function send(
        string $mac,
        ?string $broadcast = null,
        array $ports = [9, 7],
        ?string $bindIp = null
    ): bool {
        $cleanMac = preg_replace('/[^0-9A-Fa-f]/', '', $mac);
        if (strlen($cleanMac) !== 12) {
            error_log("[WakeOnLan] Endereço MAC inválido fornecido: {$mac}");
            return false;
        }

        // Magic packet: 6 x 0xFF + MAC repetido 16 vezes (102 bytes)
        $packet = str_repeat("\xFF", 6) . str_repeat(hex2bin($cleanMac), 16);
        $len = strlen($packet);

        $targets = array_values(array_unique(array_filter(['255.255.255.255', $broadcast])));
        $ports   = array_values(array_unique(array_map('intval', $ports)));

        $ok = false;
        $errors = [];

        // Método 1: ext-sockets
        if (function_exists('socket_create')) {
            $sock = @socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
            if ($sock === false) {
                $errors[] = 'socket_create: ' . socket_strerror(socket_last_error());
            } else {
                if (!@socket_set_option($sock, SOL_SOCKET, SO_BROADCAST, 1)) {
                    $errors[] = 'SO_BROADCAST: ' . socket_strerror(socket_last_error($sock));
                }
                if ($bindIp !== null && !@socket_bind($sock, $bindIp, 0)) {
                    $errors[] = "socket_bind({$bindIp}): " . socket_strerror(socket_last_error($sock));
                }
                foreach ($targets as $ip) {
                    foreach ($ports as $p) {
                        $n = @socket_sendto($sock, $packet, $len, 0, $ip, $p);
                        if ($n === false) {
                            $errors[] = "sendto {$ip}:{$p}: " . socket_strerror(socket_last_error($sock));
                        } elseif ($n > 0) {
                            $ok = true; // o SO aceitou o envio
                        }
                    }
                }
                socket_close($sock);
            }
        } else {
            $errors[] = 'extensão sockets não carregada (usando fallback)';
        }

        // Método 2: fallback via streams (agora com SO_BROADCAST habilitado)
        if (!$ok && function_exists('stream_socket_client')) {
            $opts = ['socket' => ['so_broadcast' => true]];
            if ($bindIp !== null) {
                $opts['socket']['bindto'] = "{$bindIp}:0";
            }
            $ctx = stream_context_create($opts);

            foreach ($targets as $ip) {
                foreach ($ports as $p) {
                    $fp = @stream_socket_client("udp://{$ip}:{$p}", $errno, $errstr, 2, STREAM_CLIENT_CONNECT, $ctx);
                    if (!$fp) {
                        $errors[] = "stream {$ip}:{$p}: [{$errno}] {$errstr}";
                        continue;
                    }
                    $w = @fwrite($fp, $packet);
                    fclose($fp);
                    if ($w === false || $w === 0) {
                        $errors[] = "fwrite {$ip}:{$p} falhou";
                    } else {
                        $ok = true;
                    }
                }
            }
        }

        if ($ok) {
            error_log("[WakeOnLan] Pacote mágico enviado para MAC: {$mac}");
        } else {
            error_log("[WakeOnLan] Falha ao enviar para MAC: {$mac} | " . implode(' | ', $errors));
        }

        return $ok;
    }
}