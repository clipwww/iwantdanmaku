import { ref, nextTick, defineComponent, watch, onMounted, Ref } from 'vue';
import Danmaku from 'danmaku';

interface DanmakuVM {
  text: string
  msg: string
  time: number
  color?: string
  mode?: 'rtl' | 'ltr' | 'top' | 'bottom'
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = e => resolve(e.target.result as string);
    reader.onerror = e => reject(e);
  })
};


export default defineComponent({
  setup() {
    const videoSrc = ref('');
    const inputValue = ref('');
    const danmakuUrl = ref('');
    const engine: Ref<'dom' | 'canvas'> = ref('dom');
    const comments = ref([]);
    const delay = ref(0);
    const isDragover = ref(false)
    const isLoading = ref(false);
    const isFullscreen = ref(false);
    let danmaku: Danmaku = null;

    watch([engine, isFullscreen], () => {
      initDanmaku();
    }, { immediate: false })

    watch(videoSrc, (val) => {
      if (!val && danmaku) {
        danmaku.destroy();
      }
    })

    onMounted(() => {
      document.addEventListener('fullscreenchange', (e) => {
        console.log('on fullscreenchange')
        isFullscreen.value = document.fullscreen
      })
      document.addEventListener('resize', () => {
        if (danmaku) {
          initDanmaku();
        }
      })
    })

    async function initDanmaku() {
      await nextTick();
      const vHeight = document.getElementById('js-video').clientHeight;
      let fontSize = Math.round(vHeight / 23);
      fontSize = fontSize < 16 ? 16 : fontSize;

      const newComments = comments.value.map((item: DanmakuVM) => {
        return {
          text: item.msg || item.text,
          time: item.time + delay.value,
          mode: item.mode || 'rtl',
          style: engine.value === 'dom' ? {
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            color: item.color || '#ffffff',
            textShadow: '-1px -1px #000, -1px 1px #000, 1px -1px #000, 1px 1px #000',
          } as CSSStyleDeclaration : {
              font: `${fontSize}px sans-serif`,
              textAlign: 'start',
              textBaseline: 'bottom',
              direction: 'inherit',
              fillStyle: item.color || '#ffffff',
              strokeStyle: '#fff',
              lineWidth: 1.0,
              shadowColor: '#000',
              shadowBlur: 1,
            } as CanvasRenderingContext2D,
        };
      })

      if (danmaku) {
        danmaku.destroy();
      }

      danmaku = new Danmaku({
        // engine: 'canvas',
        // engine: 'dom',
        engine: engine.value,
        container: document.getElementById('js-video-container'),
        media: document.getElementById('js-video') as HTMLVideoElement,
        comments: newComments
      });
    }

    async function getDanmaku() {
      try {
        isLoading.value = true;
        const response = await fetch(danmakuUrl.value);
        const ret = await response.json();

        if (!ret.success) {
          return;
        }

        comments.value = ret.items;
        initDanmaku();
      } catch (err) {
        console.log(err)
        alert(err);
      } finally {
        isLoading.value = false;
      }
    }

    function onDrop(e: DragEvent) {
      console.log(e)
      e.preventDefault();
      isDragover.value = false;
      videoSrc.value = window.URL.createObjectURL(e.dataTransfer.files[0])
    }

    function onUpload(e: InputEvent) {
      videoSrc.value = window.URL.createObjectURL((e.target as HTMLInputElement).files[0])
    }

    async function onDanmakuUpload(e: InputEvent) {
      const result = await readAsText((e.target as HTMLInputElement).files[0]);
      const danmaku = JSON.parse(result)
      console.log(danmaku)
      comments.value = danmaku;
      initDanmaku();
    }

    function openFullscreen() {
      const element = document.documentElement;
      element.requestFullscreen();
    }

    return {
      videoSrc,
      inputValue,
      engine,
      delay,
      danmakuUrl,
      isDragover,
      isLoading,
      isFullscreen,

      onDrop,
      onUpload,
      onDanmakuUpload,
      getDanmaku,
      openFullscreen
    }
  }
})