import type { CSSProperties, ReactElement } from "react";

export type LanyardProps = {
  frontImage?: string;
  backImage?: string;
  imageFit?: "cover" | "contain";
  cardColor?: string;
  orientation?: "portrait" | "landscape";
  finish?: "glossy" | "matte" | "holographic" | "metallic";
  cornerRadius?: number;
  size?: number;
  anchor?: "left" | "center" | "right";
  strapLength?: number;
  strapImage?: string;
  strapColor?: string;
  strapWidth?: number;
  metal?: "graphite" | "silver" | "gold";
  gravity?: number;
  damping?: number;
  elasticity?: number;
  breeze?: number;
  interactive?: boolean;
  intro?: boolean;
  /** Dipanggil setelah gambar kartu terpasang dan frame pertama tergambar (atau WebGL tidak tersedia). */
  onReady?: () => void;
  className?: string;
  style?: CSSProperties;
};

declare const Lanyard: (props: LanyardProps) => ReactElement;
export default Lanyard;
