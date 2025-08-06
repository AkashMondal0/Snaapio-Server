export const imageVariants = [
  { aspectRatio: "blur_square", width: 150, height: 150, quality: 40, blur: true },
  { aspectRatio: "square", width: 500, height: 500, quality: 70, blur: false },
  { aspectRatio: "square_sm", width: 150, height: 150, quality: 40, blur: false },
  { aspectRatio: "blur_original", width: 400, height: 600, quality: 30, blur: true },
  { aspectRatio: "original", width: 1080, height: 1350, quality: 70, blur: false },
  { aspectRatio: "original_sm", width: 400, height: 600, quality: 50, blur: false },
];

export type ImageVariantType = {
    aspectRatio: "blur_square" | "square" | "square_sm" | "blur_original" | "original" | "original_sm";
    width: number;
    height: number;
    quality: number;
    blur: boolean;
};

