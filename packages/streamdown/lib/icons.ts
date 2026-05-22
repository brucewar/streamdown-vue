/** biome-ignore-all lint/a11y/noSvgWithoutTitle: "Streamdown icons" */
import { h, type SVGAttributes } from 'vue';

type IconProps = SVGAttributes & { size?: number };

export const CheckIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      height: props.size ?? 16,
      width: props.size ?? 16,
      'stroke-linejoin': 'round',
      viewBox: '0 0 16 16',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('path', {
        'clip-rule': 'evenodd',
        d: 'M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z',
        fill: 'currentColor',
        'fill-rule': 'evenodd',
      }),
    ],
  );

export const CopyIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      height: props.size ?? 16,
      width: props.size ?? 16,
      'stroke-linejoin': 'round',
      viewBox: '0 0 16 16',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('path', {
        'clip-rule': 'evenodd',
        d: 'M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z',
        fill: 'currentColor',
        'fill-rule': 'evenodd',
      }),
    ],
  );

export const DownloadIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      height: props.size ?? 16,
      width: props.size ?? 16,
      'stroke-linejoin': 'round',
      viewBox: '0 0 16 16',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('path', {
        'clip-rule': 'evenodd',
        d: 'M8.49969 0.25H7.49969V8.58334L5.53424 6.73295L4.85176 7.45899L7.49969 9.95105L7.99969 10.4218L8.49969 9.95105L11.1476 7.45899L10.4651 6.73295L8.49969 8.58334V0.25ZM1.74969 12.25C1.74969 11.6977 2.19741 11.25 2.74969 11.25V10.25C1.64512 10.25 0.749695 11.1454 0.749695 12.25V13.25C0.749695 14.3546 1.64512 15.25 2.74969 15.25H13.2497C14.3543 15.25 15.2497 14.3546 15.2497 13.25V12.25C15.2497 11.1454 14.3543 10.25 13.2497 10.25V11.25C13.802 11.25 14.2497 11.6977 14.2497 12.25V13.25C14.2497 13.8023 13.802 14.25 13.2497 14.25H2.74969C2.19741 14.25 1.74969 13.8023 1.74969 13.25V12.25Z',
        fill: 'currentColor',
        'fill-rule': 'evenodd',
      }),
    ],
  );

export const ExternalLinkIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      fill: 'none',
      height: props.size ?? 16,
      width: props.size ?? 16,
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      viewBox: '0 0 24 24',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('path', {
        d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
      }),
      h('polyline', { points: '15 3 21 3 21 9' }),
      h('line', { x1: '10', x2: '21', y1: '14', y2: '3' }),
    ],
  );

export const Loader2Icon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      fill: 'none',
      height: props.size ?? 16,
      width: props.size ?? 16,
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      viewBox: '0 0 24 24',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [h('path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' })],
  );

export const Maximize2Icon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      height: props.size ?? 16,
      width: props.size ?? 16,
      stroke: 'currentColor',
      'stroke-linejoin': 'round',
      viewBox: '0 0 16 16',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      // h("polyline", { points: "15 3 21 3 21 9" }),
      // h("polyline", { points: "9 21 3 21 3 15" }),
      // h("line", { x1: "21", x2: "14", y1: "3", y2: "10" }),
      // h("line", { x1: "3", x2: "10", y1: "21", y2: "14" }),
      h('path', {
        clipRule: 'evenodd',
        d: 'M1 5.25V6H2.5V5.25V2.5H5.25H6V1H5.25H2C1.44772 1 1 1.44772 1 2V5.25ZM5.25 14.9994H6V13.4994H5.25H2.5V10.7494V9.99939H1V10.7494V13.9994C1 14.5517 1.44772 14.9994 2 14.9994H5.25ZM15 10V10.75V14C15 14.5523 14.5523 15 14 15H10.75H10V13.5H10.75H13.5V10.75V10H15ZM10.75 1H10V2.5H10.75H13.5V5.25V6H15V5.25V2C15 1.44772 14.5523 1 14 1H10.75Z',
        fill: 'currentColor',
        fillRule: 'evenodd',
      }),
    ],
  );

export const RotateCcwIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      fill: 'none',
      height: props.size ?? 16,
      width: props.size ?? 16,
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      viewBox: '0 0 24 24',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('polyline', { points: '1 4 1 10 7 10' }),
      h('path', { d: 'M3.51 15a9 9 0 1 0 2.13-9.36L1 10' }),
    ],
  );

export const XIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      fill: 'none',
      height: props.size ?? 16,
      width: props.size ?? 16,
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      viewBox: '0 0 24 24',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('line', { x1: '18', x2: '6', y1: '6', y2: '18' }),
      h('line', { x1: '6', x2: '18', y1: '6', y2: '18' }),
    ],
  );

export const ZoomInIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      fill: 'none',
      height: props.size ?? 16,
      width: props.size ?? 16,
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      viewBox: '0 0 24 24',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('circle', { cx: '11', cy: '11', r: '8' }),
      h('line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65' }),
      h('line', { x1: '11', x2: '11', y1: '8', y2: '14' }),
      h('line', { x1: '8', x2: '14', y1: '11', y2: '11' }),
    ],
  );

export const ZoomOutIcon = (props: IconProps) =>
  h(
    'svg',
    {
      color: 'currentColor',
      fill: 'none',
      height: props.size ?? 16,
      width: props.size ?? 16,
      stroke: 'currentColor',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      viewBox: '0 0 24 24',
      ...props,
      height: props.size ?? props.height ?? 16,
      width: props.size ?? props.width ?? 16,
    },
    [
      h('circle', { cx: '11', cy: '11', r: '8' }),
      h('line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65' }),
      h('line', { x1: '8', x2: '14', y1: '11', y2: '11' }),
    ],
  );
