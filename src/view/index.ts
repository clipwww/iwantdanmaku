import { ref, nextTick, defineComponent, watch, Ref } from 'vue';
import Danmaku from 'danmaku';

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
    const danmakuId = ref('');
    const engine: Ref<'dom' | 'canvas'> = ref('canvas');
    const comments = ref([]);
    const delay = ref(0);
    const isDragover = ref(false)
    const isLoading = ref(false);
    let danmaku: Danmaku = null;

    watch(engine, () => {
      initDanmaku();
    }, { immediate: false })

    watch(videoSrc, (val) => {
      if (!val && danmaku) {
        danmaku.destroy();
      }
    })

    async function initDanmaku() {
      await nextTick();
      const vHeight = document.getElementById('js-video').clientHeight;
      
      const newComments = comments.value.map(item => {
        return {
          text: item.msg || item.text,
          time: item.time + delay.value,
          style: engine.value === 'dom' ? {
            fontSize: `${Math.round(vHeight / 23)}px`,
            fontWeight: 'bold',
            color: '#ffffff',
            textShadow: '-1px -1px #000, -1px 1px #000, 1px -1px #000, 1px 1px #000',
          } : {
            font: `${Math.round(vHeight / 23)}px sans-serif`,
            textAlign: 'start',
            textBaseline: 'bottom',
            direction: 'inherit',
            fillStyle: '#fff',
            strokeStyle: '#fff',
            lineWidth: 1.0,
            shadowColor: '#000',
            shadowBlur: 1,
          },
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
        // @ts-ignore
        comments: newComments
      });
    }

    async function getDanmaku() {
      try {
        isLoading.value = true;
        const response = await fetch(`https://mechakucha-api.herokuapp.com/himawari/${danmakuId.value}/danmaku`);
      const ret = await response.json();

      if (!ret.success) {
        return;
      }

      comments.value = ret.items;
      } catch(err) {
        console.log(err)
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

    return {
      videoSrc,
      inputValue,
      engine,
      delay,
      danmakuId,
      isDragover,
      isLoading,

      onDrop,
      onUpload,
      onDanmakuUpload,
      getDanmaku,
    }
  }
})