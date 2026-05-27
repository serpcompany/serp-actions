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
    [--max-cycles N]

Runs:
    npx skills add https://github.com/serpdownloaders/skills --skills 123movies-downloader 123rf-downloader 321tube-downloader 3movs-downloader 4k69-downloader 4kporn-downloader 5moviesporn-downloader 8kporner-downloader 8teenxxx18-downloader abelladangertv-downloader abxxx-downloader adobe-stock-downloader adultdvdmovies-downloader al4a-downloader alamy-downloader allpornstream-downloader alpha-porno-downloader amazon-video-downloader amigosporn-downloader amtube-downloader analdin-downloader anyporn-downloader anysex-downloader ashemaletube-downloader bananamovies-downloader beeg-video-downloader bestpornflix-downloader bibamax-downloader bibamaxph-downloader bigbuttshub-downloader bilibili-downloader bingato-downloader bipornfun-downloader bongacams-downloader bootychristmas-downloader bootyexpo-downloader borwap-downloader boyfriendtv-downloader boysfood-downloader bravotube-downloader brazz-downloader brazzers3x-downloader brazzpw-downloader brightcove-video-downloader cam4-downloader camscom-downloader camsoda-downloader canva-downloader chaturbate-downloader circle-downloader clicporn-downloader clientclub-downloader collectionofbestporn-downloader coomer-downloader coursera-downloader creative-market-downloader cumlouder-downloader czechvideo-downloader dailymotion-downloader definebabe-downloader deflr-downloader depositphotos-downloader deviantart-downloader dreamcam-downloader dreamcam-vr-downloader dreamstime-downloader drtuber-downloader empflix-downloader entensity-downloader eporner-downloader erome-downloader erothots-downloader eroticmv-downloader euroxxx-downloader facebook-video-downloader fakingstv-downloader fansly-live-downloader fapality-downloader fapnado-downloader faptap-downloader flickr-downloader flirt4free-downloader foxtube-downloader fpoxxx-downloader freeomovie-downloader freeonestube-downloader freepik-downloader freepornsexnet-downloader freepornvideosxxx-downloader fullporner-downloader fullxxxmovies-downloader fuxnxx-downloader fuxxx-downloader galaxyporn-downloader getty-images-downloader gimmeporn-downloader giphy-downloader gohighlevel-downloader gokollab-downloader goonchan-downloader goonit-downloader hdeasyporn-downloader hdporn92-downloader hdpornwatch-downloader hdzog-downloader helloporn-downloader hentaihaven-downloader hornybutt-downloader hotmovs-downloader hqfap-downloader hqporner-downloader hulu-downloader hutporner-downloader iceporncasting-downloader inporn-downloader instagram-downloader internet-archive-downloader inxxx-downloader iporntv-downloader istock-downloader itnaked-downloader jerkmotion-downloader joystube-downloader justforfans-downloader justfullporn-downloader justporn-downloader kajabi-video-downloader khan-academy-downloader kick-clip-downloader kompoz2-downloader ladybanana-downloader lanarhoadestv-downloader latestleaks-downloader latestpornvideo-downloader learndash-downloader learnworlds-downloader letmejerk-downloader letsjerk-downloader linkedin-downloader linkedin-learning-downloader livejasmin-downloader loom-video-downloader lustbb-downloader luxporn-downloader luxuretv-downloader m3u8-downloader mangoporn-downloader manyvids-downloader maxporn-downloader megatube-downloader miakhalifatv-downloader mindvalley-downloader mobifcuk-downloader modporn-downloader monsterfap-downloader moodle-downloader motherless-downloader myfreecams-downloader mygoodporn-downloader mypornerleak-downloader neporn-downloader netfapx-downloader netfapxnet-downloader netflix-downloader nhentai-downloader nicovideo-downloader ogporn-downloader okporn-downloader okxxx-downloader omgxxx-downloader onlyfans-video-downloader open-video-downloader pandamovies-downloader paradisehill-downloader patreon-downloader pdf-downloader peekvids-downloader perfectgirls-downloader perverzija-downloader pexels-video-downloader phonerotica-downloader pinterest-downloader pixabay-downloader playhdporn-downloader podia-downloader porn00-downloader porn2all-downloader porn300-downloader porn4days-downloader pornapi-downloader pornbaker-downloader pornbusy-downloader porndig-downloader pornditt-downloader porndoe-downloader porndroids-downloader porneec-downloader pornekip-downloader pornezcam-downloader porngo-downloader pornhat-downloader pornhd3x-downloader pornhd4k-downloader pornhd8k-downloader pornhits-downloader pornhub-video-downloader pornlib-downloader pornmedium-downloader pornmike-downloader pornmk-downloader pornmz-downloader pornobae-downloader pornoflix-downloader pornoframe-downloader pornone-downloader pornslash-downloader pornsok-downloader pornstarstube-downloader pornsy-downloader porntop-downloader porntrex-downloader pornve-downloader pornvibe-downloader pornvideobb-downloader pornwex-downloader pornxp-downloader pussyspace-downloader rajwap-downloader rawpixel-downloader reddit-downloader reddittube-downloader redgifs-downloader redtube-video-downloader redwap-downloader saintporn-downloader scribd-downloader serp-audio-downloader serp-image-downloader serp-video-downloader severeporn-downloader sexchathu-downloader sextu-downloader sextvx-downloader sexu-downloader sexvid-downloader shooshtime-downloader shutterstock-downloader sinpartytube-downloader siska-downloader skillshare-downloader skool-video-downloader snapchat-video-downloader soundcloud-downloader soundgasm-downloader spankbang-video-downloader speedporn-downloader sprout-video-downloader squirtvideos-downloader stocksy-downloader stockvault-downloader storyblocks-downloader stream-downloader streamate-downloader streamporn-downloader stripchat-video-downloader stripchat-vr-downloader sunporno-downloader superporn-downloader swingerpornfun-downloader sxyland-downloader taxi69-downloader teachable-video-downloader telegram-video-downloader tellatv-downloader terabox-downloader thepornarea-downloader thinkific-downloader thisvid-downloader thumbnail-downloader tiktok-video-downloader tnaflix-video-downloader tokyomotion-downloader trendyporn-downloader tube8-downloader tubeorigin-downloader tubev-downloader tubi-downloader tumblr-video-downloader twitch-video-downloader twitter-video-downloader twitter-x-downloader twpornstars-downloader txxx-downloader udemy-video-downloader unsplash-downloader upornia-downloader usersporn-downloader vectorstock-downloader veporn-downloader vimeo-video-downloader vivamaxsexscene-downloader vk-video-downloader vrsmash-downloader vxxx-downloader watchporn-downloader watchxxxfree-downloader webinarjam-video-downloader whatboyswant-downloader whop-video-downloader whoreshub-downloader wistia-video-downloader worldsex-downloader wowxxx-downloader wtfpeople-downloader xcafe-downloader xcum-downloader xfantazy-downloader xfreehd-downloader xfuntaxy-downloader xgroovy-downloader xhamster-video-downloader xhamsterlive-downloader xkeezmovies-downloader xlovecam-downloader xmegadrive-downloader xmonter-downloader xmoviesforyou-downloader xnxx-video-downloader xozilla-downloader xtapes-downloader xvgold-downloader xvideos-video-downloader xxvideoss-downloader xxxbp-downloader xxxfiles-downloader xxxshut-downloader xxxtube-downloader xxxtv-downloader yesporn-downloader yespornplease-downloader yespornpleasexxx-downloader yespornvip-downloader youjizz-downloader youperv-downloader youporn-video-downloader yourdailypornvideos-downloader yourporn-downloader youtube-downloader zbporn-downloader -y

  

Parameters:
  --runs-per-cycle         Number of times to run the command per cycle
  --seconds-between-cycles Number of seconds to wait before starting the next cycle
  --seconds-between-runs   Number of seconds to wait between runs inside a cycle
  --seconds-after-cycle    Number of seconds to wait after each cycle completes
  --max-cycles             Optional maximum number of cycles to run before exiting

Example:
  ./run-skills-add-loop.sh \
    --runs-per-cycle 3 \
    --seconds-between-cycles 600 \
    --seconds-between-runs 15 \
    --seconds-after-cycle 60 \
    --max-cycles 1
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

runs_per_cycle=""
seconds_between_cycles=""
seconds_between_runs=""
seconds_after_cycle=""
max_cycles=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --runs-per-cycle)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 1
      fi
      runs_per_cycle="${2:-}"
      shift 2
      ;;
    --seconds-between-cycles)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 1
      fi
      seconds_between_cycles="${2:-}"
      shift 2
      ;;
    --seconds-between-runs)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 1
      fi
      seconds_between_runs="${2:-}"
      shift 2
      ;;
    --seconds-after-cycle)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 1
      fi
      seconds_after_cycle="${2:-}"
      shift 2
      ;;
    --max-cycles)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 1
      fi
      max_cycles="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      echo "Unexpected argument: $1" >&2
      usage >&2
      exit 1
      ;;
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

command=(
  npx
  skills
  add
  https://github.com/serpdownloaders/skills
  --skills
  skool-video-downloader
  -y
)

cycle_number=1

while true; do
  echo "Starting cycle $cycle_number"

  for (( run_number = 1; run_number <= runs_per_cycle; run_number++ )); do
    echo "Cycle $cycle_number, run $run_number/$runs_per_cycle"
    "${command[@]}"

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
