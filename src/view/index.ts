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

    function lightOrDark(color: string) {
      if (color === 'white') return 'light';
      if (color === 'black') return 'dark';
    
      // Variables for red, green, blue values
      let r: number;
      let g: number;
      let b: number;
    
      // Check the format of the color, HEX or RGB?
      if (color.match(/^rgb/)) {
        // If RGB --> store the red, green, blue values in separate variables
        const colorArr = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/) ?? [];
        r = +colorArr[1];
        g = +colorArr[2];
        b = +colorArr[3];
      }
      else {
        // If hex --> Convert it to RGB: http://gist.github.com/983661
        const colorNum = +("0x" + color.slice(1).replace(color.length < 5 ? /./g : '', '$&$&'));
        r = colorNum >> 16;
        g = colorNum >> 8 & 255;
        b = colorNum & 255;
      }
    
      // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
      const hsp = Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b)
      );
    
      return hsp > 127.5 ? 'light' : 'dark';
    }

    async function initDanmaku() {
      await nextTick();
      const vHeight = document.getElementById('js-video').clientHeight;
      let fontSize = Math.round(vHeight / 23);
      fontSize = fontSize < 16 ? 16 : fontSize;
      
      const newComments = comments.value.map((item: DanmakuVM) => {
        const shadowColor = lightOrDark(item.color || '#ffffff') === 'dark' ? '#fff' : '#000';
        return {
          text: item.msg || item.text,
          time: item.time + delay.value,
          mode: item.mode || 'rtl',
          style: engine.value === 'dom' ? {
            fontSize: `${fontSize}px`,
            fontWeight: 'bold',
            color: item.color || '#ffffff',
            textShadow: `-1px -1px ${shadowColor}, -1px 1px ${shadowColor}, 1px -1px ${shadowColor}, 1px 1px ${shadowColor}`,
          } as CSSStyleDeclaration : {
              font: `${fontSize}px sans-serif`,
              textAlign: 'start',
              textBaseline: 'bottom',
              direction: 'inherit',
              fillStyle: item.color || '#ffffff',
              strokeStyle: shadowColor,
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