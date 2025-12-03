import { memo } from 'react';
import {
  CustomMinimalIcon,
  XAIcon,
  AnthropicIcon,
  AzureMinimalIcon,
  BedrockIcon,
  GeminiIcon,
  PaLMIcon,
  CodeyIcon,
} from '@librechat/client';
import { EModelEndpoint, KnownEndpoints } from 'librechat-data-provider';
import { IconContext } from '~/common';
import { cn } from '~/utils';

const knownEndpointAssets: Record<string, string> = {
  // Major providers
  anyscale: 'assets/anyscale.svg',
  anthropic: 'assets/anthropic.svg',
  claude: 'assets/claude.svg',
  cohere: 'assets/cohere.svg',
  deepseek: 'assets/deepseek.svg',
  fireworks: 'assets/fireworks.svg',
  google: 'assets/google.svg',
  groq: 'assets/groq.svg',
  grok: 'assets/grok.svg',
  huggingface: 'assets/huggingface.svg',
  mistral: 'assets/mistral.svg',
  mistralai: 'assets/mistral.svg',
  meta: 'assets/meta.svg',
  'meta-llama': 'assets/meta.svg',
  metaai: 'assets/metaai.svg',
  'meta-ai': 'assets/metaai.svg',
  'meta ai': 'assets/metaai.svg',
  llama: 'assets/meta.svg',
  ollama: 'assets/ollama.svg',
  openai: 'assets/openai.svg',
  openrouter: 'assets/AI.png',
  perplexity: 'assets/perplexity.svg',
  qwen: 'assets/qwen.svg',
  together: 'assets/together.svg',
  'together.ai': 'assets/together.svg',
  palm: 'assets/palm.svg',
  gemini: 'assets/gemini.svg',
  azure: 'assets/azure.svg',
  azureai: 'assets/azureai.svg',
  microsoft: 'assets/azure.svg',
  bedrock: 'assets/bedrock.svg',
  amazon: 'assets/bedrock.svg',
  aws: 'assets/aws.svg',
  xai: 'assets/xai.svg',
  'x-ai': 'assets/xai.svg',

  // Additional providers from lobe-icons
  adobe: 'assets/adobe.svg',
  adobefirefly: 'assets/adobefirefly.svg',
  ai21: 'assets/ai21.svg',
  ai302: 'assets/ai302.svg',
  ai360: 'assets/ai360.svg',
  aihubmix: 'assets/aihubmix.svg',
  aimass: 'assets/aimass.svg',
  aionlabs: 'assets/aionlabs.svg',
  'aion-labs': 'assets/aionlabs.svg',
  aistudio: 'assets/aistudio.svg',
  alibaba: 'assets/alibaba.svg',
  alibabacloud: 'assets/alibabacloud.svg',
  alephalpha: 'assets/alephalpha.svg',
  allenai: 'assets/AI.png', // No SVG available
  alpindale: 'assets/AI.png', // No SVG available
  alfredpros: 'assets/AI.png', // No SVG available
  'anthracite-org': 'assets/AI.png', // No SVG available
  'arcee-ai': 'assets/AI.png', // No SVG available
  arliai: 'assets/AI.png', // No SVG available
  assemblyai: 'assets/assemblyai.svg',
  aya: 'assets/aya.svg',
  baai: 'assets/baai.svg',
  baichuan: 'assets/baichuan.svg',
  baidu: 'assets/baidu.svg',
  baiducloud: 'assets/baiducloud.svg',
  bailian: 'assets/bailian.svg',
  baseten: 'assets/baseten.svg',
  bfl: 'assets/bfl.svg',
  bilibili: 'assets/bilibili.svg',
  bing: 'assets/bing.svg',
  bytedance: 'assets/bytedance.svg',
  capcut: 'assets/capcut.svg',
  cerebras: 'assets/cerebras.svg',
  chatglm: 'assets/chatglm.svg',
  civitai: 'assets/civitai.svg',
  cline: 'assets/cline.svg',
  clipdrop: 'assets/clipdrop.svg',
  cloudflare: 'assets/cloudflare.svg',
  codegeex: 'assets/codegeex.svg',
  cognitivecomputations: 'assets/AI.png', // No SVG available
  cogvideo: 'assets/cogvideo.svg',
  cogview: 'assets/cogview.svg',
  colab: 'assets/colab.svg',
  cometapi: 'assets/cometapi.svg',
  comfyui: 'assets/comfyui.svg',
  copilot: 'assets/copilot.svg',
  coze: 'assets/coze.svg',
  cursor: 'assets/cursor.svg',
  dalle: 'assets/dalle.svg',
  'dall-e': 'assets/dalle.svg',
  dbrx: 'assets/dbrx.svg',
  deepcogito: 'assets/AI.png', // No SVG available
  deepinfra: 'assets/deepinfra.svg',
  deepl: 'assets/deepl.svg',
  deepmind: 'assets/deepmind.svg',
  dify: 'assets/dify.svg',
  doubao: 'assets/doubao.svg',
  elevenlabs: 'assets/elevenlabs.svg',
  eleutherai: 'assets/AI.png', // No SVG available
  fal: 'assets/fal.svg',
  fastgpt: 'assets/fastgpt.svg',
  figma: 'assets/figma.svg',
  flux: 'assets/flux.svg',
  gemma: 'assets/gemma.svg',
  github: 'assets/github.svg',
  githubcopilot: 'assets/githubcopilot.svg',
  glif: 'assets/glif.svg',
  googlecloud: 'assets/googlecloud.svg',
  gradio: 'assets/gradio.svg',
  gryphe: 'assets/AI.png', // No SVG available
  hunyuan: 'assets/hunyuan.svg',
  'ibm-granite': 'assets/AI.png', // No SVG available
  inception: 'assets/inception.svg',
  inflection: 'assets/inflection.svg',
  kimi: 'assets/kimi.svg',
  kwaipilot: 'assets/kwaipilot.svg',
  langchain: 'assets/langchain.svg',
  lepton: 'assets/lepton.svg',
  liquid: 'assets/liquid.svg',
  llamaindex: 'assets/llamaindex.svg',
  lmsys: 'assets/lmsys.svg',
  luma: 'assets/luma.svg',
  mancer: 'assets/AI.png', // No SVG available
  meituan: 'assets/AI.png', // No SVG available
  midjourney: 'assets/midjourney.svg',
  minimax: 'assets/minimax.svg',
  mlx: 'assets/mlx.svg',
  moonshot: 'assets/moonshot.svg',
  moonshotai: 'assets/moonshot.svg',
  morph: 'assets/AI.png', // No SVG available
  neversleep: 'assets/AI.png', // No SVG available
  nousresearch: 'assets/nousresearch.svg',
  nvidia: 'assets/nvidia.svg',
  opengvlab: 'assets/AI.png', // No SVG available
  openweather: 'assets/openweather.svg',
  pika: 'assets/pika.svg',
  poe: 'assets/poe.svg',
  'prime-intellect': 'assets/AI.png', // No SVG available
  raifle: 'assets/AI.png', // No SVG available
  relace: 'assets/AI.png', // No SVG available
  replicate: 'assets/replicate.svg',
  runway: 'assets/runway.svg',
  sao10k: 'assets/AI.png', // No SVG available
  siliconcloud: 'assets/siliconcloud.svg',
  sora: 'assets/sora.svg',
  stability: 'assets/stability.svg',
  stepfun: 'assets/stepfun.svg',
  'stepfun-ai': 'assets/stepfun.svg',
  suno: 'assets/suno.svg',
  switchpoint: 'assets/AI.png', // No SVG available
  tencent: 'assets/tencent.svg',
  thedrummer: 'assets/AI.png', // No SVG available
  thudm: 'assets/AI.png', // No SVG available
  tngtech: 'assets/AI.png', // No SVG available
  undi95: 'assets/AI.png', // No SVG available
  unify: 'assets/unify.svg',
  vercel: 'assets/vercel.svg',
  vertexai: 'assets/vertexai.svg',
  yi: 'assets/yi.svg',
  zhipu: 'assets/zhipu.svg',
  zai: 'assets/zai.svg',
  'z-ai': 'assets/zai.svg',

  // Legacy/fallback
  apipie: 'assets/apipie.png',
  shuttleai: 'assets/shuttleai.png',
};

const knownEndpointClasses = {
  [KnownEndpoints.cohere]: {
    [IconContext.landing]: 'p-2',
  },
  [KnownEndpoints.xai]: {
    [IconContext.landing]: 'p-2',
  },
};

const getKnownClass = ({
  currentEndpoint,
  context = '',
  className,
}: {
  currentEndpoint: string;
  context?: string;
  className: string;
}) => {
  if (currentEndpoint === KnownEndpoints.openrouter) {
    return className;
  }

  const match = knownEndpointClasses[currentEndpoint]?.[context] ?? '';
  const defaultClass = context === IconContext.landing ? '' : className;

  return cn(match, defaultClass);
};

function UnknownIcon({
  className = '',
  endpoint: _endpoint,
  iconURL = '',
  context,
}: {
  iconURL?: string;
  className?: string;
  endpoint?: EModelEndpoint | string | null;
  context?: 'landing' | 'menu-item' | 'nav' | 'message';
}) {
  const endpoint = _endpoint ?? '';
  if (!endpoint) {
    return <CustomMinimalIcon className={className} />;
  }

  const currentEndpoint = endpoint.toLowerCase();

  // Debug: log the endpoint name to help troubleshoot
  if (process.env.NODE_ENV === 'development') {
    console.log('UnknownIcon endpoint:', endpoint, '-> currentEndpoint:', currentEndpoint);
  }

  if (currentEndpoint === KnownEndpoints.xai) {
    return (
      <XAIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (currentEndpoint === 'anthropic') {
    return (
      <AnthropicIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (currentEndpoint === 'azure' || currentEndpoint === 'microsoft') {
    return (
      <AzureMinimalIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (currentEndpoint === 'bedrock' || currentEndpoint === 'amazon') {
    return (
      <BedrockIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (currentEndpoint === 'gemini') {
    return (
      <GeminiIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (currentEndpoint === 'palm') {
    return (
      <PaLMIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (currentEndpoint === 'codey') {
    return (
      <CodeyIcon
        className={getKnownClass({
          currentEndpoint,
          context: context,
          className,
        })}
      />
    );
  }

  if (iconURL) {
    return <img className={className} src={iconURL} alt={`${endpoint} Icon`} />;
  }

  const assetPath: string = knownEndpointAssets[currentEndpoint] ?? '';

  if (!assetPath) {
    // Try to find an SVG file with the endpoint name
    // First try the exact name, then try with spaces removed, then with hyphens removed
    const normalizedEndpoint = currentEndpoint.replace(/\s+/g, '').replace(/-/g, '');
    const potentialPaths = [
      `assets/${currentEndpoint}.svg`,
      `assets/${normalizedEndpoint}.svg`,
      `assets/${currentEndpoint.replace(/\s+/g, '-')}.svg`,
    ];

    return (
      <img
        className={cn(className, 'h-full w-full object-contain')}
        src={potentialPaths[0]}
        alt={`${currentEndpoint} Icon`}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          // Try the next path in sequence
          const currentSrc = img.src;
          const currentPath = currentSrc.split('/').pop() || '';

          if (currentPath === `${currentEndpoint}.svg`) {
            img.src = potentialPaths[1];
          } else if (currentPath === `${normalizedEndpoint}.svg`) {
            img.src = potentialPaths[2];
          } else {
            // Final fallback to AI.png
            img.src = 'assets/AI.png';
          }
        }}
      />
    );
  }

  return (
    <img
      className={getKnownClass({
        currentEndpoint,
        context: context,
        className,
      })}
      src={assetPath}
      alt={`${currentEndpoint} Icon`}
    />
  );
}

export default memo(UnknownIcon);
