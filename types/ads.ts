export interface AdSettings {
    enabled: boolean;
    title: string;
    description: string;
    ctaText: string;
    linkUrl: string;
    imageUrl?: string;
}

export const DEFAULT_AD_SETTINGS: AdSettings = {
    enabled: true,
    title: "Element Games",
    description: "Get 15-20% off Warhammer & hobby supplies!",
    ctaText: "Shop Now",
    linkUrl: "https://elementgames.co.uk/?d=10279",
};
