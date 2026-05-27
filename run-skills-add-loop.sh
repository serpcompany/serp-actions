#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  run-skills-add-loop.sh \
    --runs-per-cycle N \
    --seconds-between-cycles N \
    --seconds-between-runs N \
    --seconds-after-cycle N \
    [--max-cycles N] \
    [--mode github|smithery|both] \
    [--smithery-namespace NAMESPACE] \
    [--seconds-between-smithery-adds N] \
    [--dry-run]

Runs the legacy bulk GitHub skill install and/or one Smithery install per skill:
  npx -y skills add https://github.com/serpdownloaders/skills --skill '*' -y
  npx -y skills add https://smithery.ai/skills/serpdownloaders/123rf-downloader

Default mode is both. Smithery currently exposes one installable skill per URL, so Smithery mode runs the explicit Smithery commands listed in this script.
EOF
}

require_integer() {
  local name="$1"
  local value="$2"

  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "Invalid value for $name: $value" >&2
    exit 1
  fi
}

run_command() {
  if [[ "$dry_run" == "1" ]]; then
    printf 'DRY RUN:'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

maybe_sleep_between_smithery_adds() {
  if (( seconds_between_smithery_adds > 0 )); then
    sleep "$seconds_between_smithery_adds"
  fi
}

run_add_once() {
  case "$mode" in
    github|both)
      echo "Running GitHub bulk skills add for all skills"
      run_command npx -y skills add https://github.com/serpdownloaders/skills --skill '*' -y
      ;;
  esac

  case "$mode" in
    smithery|both)
      run_smithery_add_commands
      ;;
  esac
}

run_smithery_add_commands() {
  echo "Running Smithery skills add for 351 skills in namespace $smithery_namespace"
  echo "Smithery skill 1/351: 123movies-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/123movies-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 2/351: 123rf-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/123rf-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 3/351: 321tube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/321tube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 4/351: 3movs-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/3movs-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 5/351: 4k69-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/4k69-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 6/351: 4kporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/4kporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 7/351: 5moviesporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/5moviesporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 8/351: 8kporner-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/8kporner-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 9/351: 8teenxxx18-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/8teenxxx18-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 10/351: abelladangertv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/abelladangertv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 11/351: abxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/abxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 12/351: adobe-stock-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/adobe-stock-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 13/351: adultdvdmovies-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/adultdvdmovies-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 14/351: al4a-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/al4a-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 15/351: alamy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/alamy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 16/351: allpornstream-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/allpornstream-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 17/351: alpha-porno-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/alpha-porno-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 18/351: amazon-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/amazon-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 19/351: amigosporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/amigosporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 20/351: amtube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/amtube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 21/351: analdin-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/analdin-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 22/351: anyporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/anyporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 23/351: anysex-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/anysex-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 24/351: ashemaletube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/ashemaletube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 25/351: bananamovies-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bananamovies-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 26/351: beeg-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/beeg-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 27/351: bestpornflix-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bestpornflix-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 28/351: bibamax-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bibamax-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 29/351: bibamaxph-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bibamaxph-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 30/351: bigbuttshub-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bigbuttshub-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 31/351: bilibili-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bilibili-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 32/351: bingato-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bingato-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 33/351: bipornfun-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bipornfun-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 34/351: bongacams-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bongacams-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 35/351: bootychristmas-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bootychristmas-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 36/351: bootyexpo-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bootyexpo-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 37/351: borwap-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/borwap-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 38/351: boyfriendtv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/boyfriendtv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 39/351: boysfood-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/boysfood-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 40/351: bravotube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/bravotube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 41/351: brazz-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/brazz-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 42/351: brazzers3x-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/brazzers3x-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 43/351: brazzpw-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/brazzpw-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 44/351: brightcove-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/brightcove-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 45/351: cam4-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/cam4-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 46/351: camscom-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/camscom-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 47/351: camsoda-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/camsoda-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 48/351: canva-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/canva-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 49/351: chaturbate-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/chaturbate-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 50/351: circle-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/circle-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 51/351: clicporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/clicporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 52/351: clientclub-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/clientclub-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 53/351: collectionofbestporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/collectionofbestporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 54/351: coomer-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/coomer-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 55/351: coursera-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/coursera-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 56/351: creative-market-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/creative-market-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 57/351: cumlouder-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/cumlouder-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 58/351: czechvideo-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/czechvideo-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 59/351: dailymotion-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/dailymotion-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 60/351: definebabe-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/definebabe-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 61/351: deflr-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/deflr-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 62/351: depositphotos-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/depositphotos-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 63/351: deviantart-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/deviantart-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 64/351: dreamcam-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/dreamcam-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 65/351: dreamcam-vr-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/dreamcam-vr-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 66/351: dreamstime-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/dreamstime-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 67/351: drtuber-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/drtuber-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 68/351: empflix-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/empflix-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 69/351: entensity-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/entensity-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 70/351: eporner-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/eporner-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 71/351: erome-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/erome-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 72/351: erothots-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/erothots-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 73/351: eroticmv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/eroticmv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 74/351: euroxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/euroxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 75/351: facebook-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/facebook-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 76/351: fakingstv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fakingstv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 77/351: fansly-live-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fansly-live-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 78/351: fapality-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fapality-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 79/351: fapnado-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fapnado-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 80/351: faptap-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/faptap-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 81/351: flickr-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/flickr-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 82/351: flirt4free-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/flirt4free-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 83/351: foxtube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/foxtube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 84/351: fpoxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fpoxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 85/351: freeomovie-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/freeomovie-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 86/351: freeonestube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/freeonestube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 87/351: freepik-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/freepik-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 88/351: freepornsexnet-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/freepornsexnet-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 89/351: freepornvideosxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/freepornvideosxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 90/351: fullporner-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fullporner-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 91/351: fullxxxmovies-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fullxxxmovies-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 92/351: fuxnxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fuxnxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 93/351: fuxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/fuxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 94/351: galaxyporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/galaxyporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 95/351: getty-images-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/getty-images-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 96/351: gimmeporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/gimmeporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 97/351: giphy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/giphy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 98/351: gohighlevel-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/gohighlevel-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 99/351: gokollab-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/gokollab-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 100/351: goonchan-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/goonchan-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 101/351: goonit-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/goonit-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 102/351: hdeasyporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hdeasyporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 103/351: hdporn92-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hdporn92-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 104/351: hdpornwatch-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hdpornwatch-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 105/351: hdzog-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hdzog-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 106/351: helloporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/helloporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 107/351: hentaihaven-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hentaihaven-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 108/351: hornybutt-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hornybutt-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 109/351: hotmovs-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hotmovs-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 110/351: hqfap-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hqfap-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 111/351: hqporner-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hqporner-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 112/351: hulu-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hulu-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 113/351: hutporner-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/hutporner-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 114/351: iceporncasting-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/iceporncasting-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 115/351: inporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/inporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 116/351: instagram-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/instagram-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 117/351: internet-archive-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/internet-archive-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 118/351: inxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/inxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 119/351: iporntv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/iporntv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 120/351: istock-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/istock-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 121/351: itnaked-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/itnaked-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 122/351: jerkmotion-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/jerkmotion-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 123/351: joystube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/joystube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 124/351: justforfans-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/justforfans-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 125/351: justfullporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/justfullporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 126/351: justporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/justporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 127/351: kajabi-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/kajabi-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 128/351: khan-academy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/khan-academy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 129/351: kick-clip-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/kick-clip-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 130/351: kompoz2-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/kompoz2-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 131/351: ladybanana-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/ladybanana-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 132/351: lanarhoadestv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/lanarhoadestv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 133/351: latestleaks-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/latestleaks-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 134/351: latestpornvideo-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/latestpornvideo-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 135/351: learndash-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/learndash-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 136/351: learnworlds-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/learnworlds-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 137/351: letmejerk-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/letmejerk-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 138/351: letsjerk-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/letsjerk-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 139/351: linkedin-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/linkedin-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 140/351: linkedin-learning-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/linkedin-learning-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 141/351: livejasmin-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/livejasmin-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 142/351: loom-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/loom-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 143/351: lustbb-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/lustbb-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 144/351: luxporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/luxporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 145/351: luxuretv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/luxuretv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 146/351: m3u8-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/m3u8-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 147/351: mangoporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/mangoporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 148/351: manyvids-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/manyvids-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 149/351: maxporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/maxporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 150/351: megatube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/megatube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 151/351: miakhalifatv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/miakhalifatv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 152/351: mindvalley-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/mindvalley-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 153/351: mobifcuk-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/mobifcuk-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 154/351: modporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/modporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 155/351: monsterfap-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/monsterfap-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 156/351: moodle-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/moodle-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 157/351: motherless-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/motherless-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 158/351: myfreecams-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/myfreecams-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 159/351: mygoodporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/mygoodporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 160/351: mypornerleak-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/mypornerleak-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 161/351: neporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/neporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 162/351: netfapx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/netfapx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 163/351: netfapxnet-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/netfapxnet-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 164/351: netflix-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/netflix-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 165/351: nhentai-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/nhentai-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 166/351: nicovideo-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/nicovideo-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 167/351: ogporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/ogporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 168/351: okporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/okporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 169/351: okxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/okxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 170/351: omgxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/omgxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 171/351: onlyfans-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/onlyfans-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 172/351: open-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/open-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 173/351: pandamovies-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pandamovies-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 174/351: paradisehill-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/paradisehill-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 175/351: patreon-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/patreon-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 176/351: pdf-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pdf-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 177/351: peekvids-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/peekvids-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 178/351: perfectgirls-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/perfectgirls-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 179/351: perverzija-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/perverzija-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 180/351: pexels-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pexels-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 181/351: phonerotica-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/phonerotica-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 182/351: pinterest-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pinterest-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 183/351: pixabay-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pixabay-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 184/351: playhdporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/playhdporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 185/351: podia-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/podia-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 186/351: porn00-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porn00-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 187/351: porn2all-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porn2all-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 188/351: porn300-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porn300-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 189/351: porn4days-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porn4days-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 190/351: pornapi-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornapi-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 191/351: pornbaker-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornbaker-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 192/351: pornbusy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornbusy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 193/351: porndig-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porndig-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 194/351: pornditt-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornditt-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 195/351: porndoe-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porndoe-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 196/351: porndroids-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porndroids-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 197/351: porneec-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porneec-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 198/351: pornekip-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornekip-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 199/351: pornezcam-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornezcam-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 200/351: porngo-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porngo-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 201/351: pornhat-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornhat-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 202/351: pornhd3x-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornhd3x-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 203/351: pornhd4k-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornhd4k-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 204/351: pornhd8k-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornhd8k-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 205/351: pornhits-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornhits-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 206/351: pornhub-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornhub-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 207/351: pornlib-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornlib-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 208/351: pornmedium-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornmedium-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 209/351: pornmike-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornmike-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 210/351: pornmk-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornmk-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 211/351: pornmz-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornmz-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 212/351: pornobae-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornobae-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 213/351: pornoflix-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornoflix-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 214/351: pornoframe-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornoframe-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 215/351: pornone-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornone-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 216/351: pornslash-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornslash-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 217/351: pornsok-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornsok-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 218/351: pornstarstube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornstarstube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 219/351: pornsy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornsy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 220/351: porntop-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porntop-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 221/351: porntrex-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/porntrex-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 222/351: pornve-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornve-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 223/351: pornvibe-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornvibe-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 224/351: pornvideobb-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornvideobb-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 225/351: pornwex-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornwex-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 226/351: pornxp-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pornxp-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 227/351: pussyspace-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/pussyspace-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 228/351: rajwap-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/rajwap-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 229/351: rawpixel-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/rawpixel-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 230/351: reddit-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/reddit-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 231/351: reddittube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/reddittube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 232/351: redgifs-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/redgifs-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 233/351: redtube-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/redtube-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 234/351: redwap-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/redwap-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 235/351: saintporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/saintporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 236/351: scribd-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/scribd-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 237/351: serp-audio-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/serp-audio-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 238/351: serp-image-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/serp-image-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 239/351: serp-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/serp-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 240/351: serp-video-tools"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/serp-video-tools"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 241/351: severeporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/severeporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 242/351: sexchathu-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sexchathu-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 243/351: sextu-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sextu-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 244/351: sextvx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sextvx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 245/351: sexu-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sexu-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 246/351: sexvid-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sexvid-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 247/351: shooshtime-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/shooshtime-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 248/351: shutterstock-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/shutterstock-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 249/351: sinpartytube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sinpartytube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 250/351: siska-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/siska-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 251/351: skillshare-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/skillshare-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 252/351: skool-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/skool-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 253/351: snapchat-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/snapchat-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 254/351: soundcloud-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/soundcloud-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 255/351: soundgasm-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/soundgasm-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 256/351: spankbang-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/spankbang-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 257/351: speedporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/speedporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 258/351: sprout-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sprout-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 259/351: squirtvideos-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/squirtvideos-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 260/351: stocksy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/stocksy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 261/351: stockvault-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/stockvault-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 262/351: storyblocks-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/storyblocks-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 263/351: stream-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/stream-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 264/351: streamate-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/streamate-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 265/351: streamporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/streamporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 266/351: stripchat-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/stripchat-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 267/351: stripchat-vr-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/stripchat-vr-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 268/351: subscription-tracking-manager"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/subscription-tracking-manager"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 269/351: sunporno-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sunporno-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 270/351: superporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/superporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 271/351: swingerpornfun-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/swingerpornfun-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 272/351: sxyland-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/sxyland-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 273/351: taxi69-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/taxi69-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 274/351: teachable-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/teachable-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 275/351: telegram-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/telegram-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 276/351: tellatv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tellatv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 277/351: terabox-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/terabox-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 278/351: thepornarea-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/thepornarea-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 279/351: thinkific-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/thinkific-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 280/351: thisvid-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/thisvid-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 281/351: thumbnail-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/thumbnail-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 282/351: tiktok-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tiktok-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 283/351: tnaflix-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tnaflix-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 284/351: tokyomotion-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tokyomotion-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 285/351: trendyporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/trendyporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 286/351: tube8-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tube8-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 287/351: tubeorigin-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tubeorigin-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 288/351: tubev-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tubev-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 289/351: tubi-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tubi-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 290/351: tumblr-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/tumblr-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 291/351: twitch-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/twitch-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 292/351: twitter-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/twitter-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 293/351: twitter-x-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/twitter-x-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 294/351: twpornstars-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/twpornstars-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 295/351: txxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/txxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 296/351: udemy-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/udemy-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 297/351: unsplash-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/unsplash-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 298/351: upornia-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/upornia-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 299/351: usersporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/usersporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 300/351: vectorstock-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/vectorstock-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 301/351: veporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/veporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 302/351: vimeo-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/vimeo-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 303/351: vivamaxsexscene-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/vivamaxsexscene-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 304/351: vk-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/vk-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 305/351: vrsmash-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/vrsmash-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 306/351: vxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/vxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 307/351: watchporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/watchporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 308/351: watchxxxfree-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/watchxxxfree-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 309/351: webinarjam-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/webinarjam-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 310/351: whatboyswant-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/whatboyswant-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 311/351: whop-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/whop-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 312/351: whoreshub-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/whoreshub-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 313/351: wistia-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/wistia-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 314/351: worldsex-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/worldsex-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 315/351: wowxxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/wowxxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 316/351: wtfpeople-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/wtfpeople-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 317/351: xcafe-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xcafe-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 318/351: xcum-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xcum-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 319/351: xfantazy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xfantazy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 320/351: xfreehd-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xfreehd-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 321/351: xfuntaxy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xfuntaxy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 322/351: xgroovy-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xgroovy-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 323/351: xhamster-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xhamster-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 324/351: xhamsterlive-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xhamsterlive-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 325/351: xkeezmovies-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xkeezmovies-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 326/351: xlovecam-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xlovecam-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 327/351: xmegadrive-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xmegadrive-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 328/351: xmonter-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xmonter-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 329/351: xmoviesforyou-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xmoviesforyou-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 330/351: xnxx-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xnxx-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 331/351: xozilla-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xozilla-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 332/351: xtapes-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xtapes-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 333/351: xvgold-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xvgold-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 334/351: xvideos-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xvideos-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 335/351: xxvideoss-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xxvideoss-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 336/351: xxxbp-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xxxbp-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 337/351: xxxfiles-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xxxfiles-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 338/351: xxxshut-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xxxshut-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 339/351: xxxtube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xxxtube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 340/351: xxxtv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/xxxtv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 341/351: yesporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/yesporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 342/351: yespornplease-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/yespornplease-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 343/351: yespornpleasexxx-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/yespornpleasexxx-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 344/351: yespornvip-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/yespornvip-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 345/351: youjizz-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/youjizz-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 346/351: youperv-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/youperv-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 347/351: youporn-video-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/youporn-video-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 348/351: yourdailypornvideos-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/yourdailypornvideos-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 349/351: yourporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/yourporn-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 350/351: youtube-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/youtube-downloader"
  maybe_sleep_between_smithery_adds
  echo "Smithery skill 351/351: zbporn-downloader"
  run_command npx -y skills add "https://smithery.ai/skills/$smithery_namespace/zbporn-downloader"
}

runs_per_cycle=""
seconds_between_cycles=""
seconds_between_runs=""
seconds_after_cycle=""
max_cycles=""
mode="both"
smithery_namespace="serpdownloaders"
seconds_between_smithery_adds="0"
dry_run="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs-per-cycle)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      runs_per_cycle="${2:-}"; shift 2 ;;
    --seconds-between-cycles)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_between_cycles="${2:-}"; shift 2 ;;
    --seconds-between-runs)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_between_runs="${2:-}"; shift 2 ;;
    --seconds-after-cycle)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_after_cycle="${2:-}"; shift 2 ;;
    --max-cycles)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      max_cycles="${2:-}"; shift 2 ;;
    --mode)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      mode="${2:-}"; shift 2 ;;
    --smithery-namespace)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      smithery_namespace="${2:-}"; shift 2 ;;
    --seconds-between-smithery-adds)
      if [[ $# -lt 2 ]]; then echo "Missing value for $1" >&2; usage >&2; exit 1; fi
      seconds_between_smithery_adds="${2:-}"; shift 2 ;;
    --dry-run)
      dry_run="1"; shift ;;
    -h|--help)
      usage; exit 0 ;;
    --*)
      echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
    *)
      echo "Unexpected argument: $1" >&2; usage >&2; exit 1 ;;
  esac
done

if [[ -z "$runs_per_cycle" || -z "$seconds_between_cycles" || -z "$seconds_between_runs" || -z "$seconds_after_cycle" ]]; then
  usage >&2
  exit 1
fi

require_integer "runs_per_cycle" "$runs_per_cycle"
require_integer "seconds_between_cycles" "$seconds_between_cycles"
require_integer "seconds_between_runs" "$seconds_between_runs"
require_integer "seconds_after_cycle" "$seconds_after_cycle"
require_integer "seconds_between_smithery_adds" "$seconds_between_smithery_adds"

if [[ -n "$max_cycles" ]]; then
  require_integer "max_cycles" "$max_cycles"
fi

if (( runs_per_cycle < 1 )); then
  echo "runs_per_cycle must be at least 1" >&2
  exit 1
fi

if [[ -n "$max_cycles" ]] && (( max_cycles < 1 )); then
  echo "max_cycles must be at least 1" >&2
  exit 1
fi

case "$mode" in
  github|smithery|both) ;;
  *) echo "mode must be github, smithery, or both" >&2; exit 1 ;;
esac

cycle_number=1

while true; do
  echo "Starting cycle $cycle_number"

  for (( run_number = 1; run_number <= runs_per_cycle; run_number++ )); do
    echo "Cycle $cycle_number, run $run_number/$runs_per_cycle"
    run_add_once

    if (( run_number < runs_per_cycle && seconds_between_runs > 0 )); then
      echo "Sleeping $seconds_between_runs seconds before the next run"
      sleep "$seconds_between_runs"
    fi
  done

  if (( seconds_after_cycle > 0 )); then
    echo "Sleeping $seconds_after_cycle seconds after cycle $cycle_number"
    sleep "$seconds_after_cycle"
  fi

  if [[ -n "$max_cycles" ]] && (( cycle_number >= max_cycles )); then
    echo "Reached max cycles ($max_cycles); exiting"
    break
  fi

  if (( seconds_between_cycles > 0 )); then
    echo "Sleeping $seconds_between_cycles seconds before cycle $((cycle_number + 1))"
    sleep "$seconds_between_cycles"
  fi

  cycle_number=$(( cycle_number + 1 ))
done
