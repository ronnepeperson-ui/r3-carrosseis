# Stories diários R3 (@r3tech.br)
Branch `stories`: gerador de vídeo (kit/) e arquivos diários (daily/AAAA-MM-DD/).
Uso: `cd kit && node build.mjs specs/<id>.json <saida>` -> `<id>.mp4` + `<id>-capa.png`. `DRY=1` só confere e gera prévias.
Requer: playwright (chromium) e ffmpeg.
