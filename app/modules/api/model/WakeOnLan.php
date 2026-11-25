<?php
/**
 * Minimal Wake-on-LAN helper.
 * Sends a magic packet to the given MAC address via UDP broadcast.
 * Usage: WakeOnLan::send('AA:BB:CC:DD:EE:FF');
 */
class WakeOnLan {
    /**
     * Sends a magic packet.
     * @param string $mac MAC address (e.g., "AA:BB:CC:DD:EE:FF")
     * @param int $port UDP port, default 9 (discard)
     * @return bool true on success, false on failure
     */
    public static function send(string $mac, int $port = 9): bool {
        // Clean MAC address
        $cleanMac = preg_replace('/[^0-9A-Fa-f]/', '', $mac);
        if (strlen($cleanMac) !== 12) {
            error_log("[WakeOnLan] Endereço MAC inválido fornecido: {$mac}");
            return false;
        }

        // Build magic packet: 6 x 0xFF followed by MAC repeated 16 times (total 102 bytes)
        $packet = str_repeat(chr(0xFF), 6);
        $macBytes = '';
        for ($i = 0; $i < 12; $i += 2) {
            $macBytes .= chr(hexdec(substr($cleanMac, $i, 2)));
        }
        $packet .= str_repeat($macBytes, 16);

        $sentSuccessfully = false;

        // Broadcast targets: limited broadcast and local subnet broadcast
        $targets = ['255.255.255.255', '192.168.0.255'];
        $ports = array_unique([$port, 7, 9]);

        // Method 1: ext-sockets (socket_create)
        if (function_exists('socket_create')) {
            $sock = @socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
            if ($sock !== false) {
                @socket_set_option($sock, SOL_SOCKET, SO_BROADCAST, 1);
                foreach ($targets as $targetIp) {
                    foreach ($ports as $targetPort) {
                        $bytesSent = @socket_sendto($sock, $packet, strlen($packet), 0, $targetIp, $targetPort);
                        if ($bytesSent === strlen($packet)) {
                            $sentSuccessfully = true;
                        }
                    }
                }
                @socket_close($sock);
            }
        }

        // Method 2: Fallback via stream socket if socket_create failed or was unavailable
        if (!$sentSuccessfully && function_exists('stream_socket_client')) {
            foreach ($targets as $targetIp) {
                foreach ($ports as $targetPort) {
                    $fp = @stream_socket_client("udp://{$targetIp}:{$targetPort}", $errno, $errstr, 2);
                    if ($fp) {
                        $bytesWritten = @fwrite($fp, $packet);
                        @fclose($fp);
                        if ($bytesWritten === strlen($packet)) {
                            $sentSuccessfully = true;
                        }
                    }
                }
            }
        }

        if ($sentSuccessfully) {
            error_log("[WakeOnLan] Pacote mágico enviado com sucesso para MAC: {$mac}");
        } else {
            error_log("[WakeOnLan] Falha ao enviar pacote mágico para MAC: {$mac}");
        }

        return $sentSuccessfully;
    }
}
?>