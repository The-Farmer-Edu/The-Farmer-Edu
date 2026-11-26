<?php
    class InitConfig {
        public string $mainHost;
        public string $hostJudge0;
        public string $hostOllama;
        public string $geminiApiKey;
        public string $wolMac;

        public function __construct(){
            $env_data = parse_ini_file(__DIR__ . "/../.env");
            $this->mainHost = $env_data['MAIN_HOST'];
            $this->hostJudge0 = $env_data['HOST_JUDGE0'];
            $this->hostOllama = $env_data['HOST_OLLAMA'];
            $this->geminiApiKey = $env_data['GEMINI_API_KEY'];
            $this->wolMac = $env_data['WOL_MAC'];
        }
    }

?>