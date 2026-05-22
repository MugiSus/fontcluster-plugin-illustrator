export interface FontclusterFontMetadata {
  safe_name: string;
  font_name: string;
  family_name: string;
  family_names: Record<string, string>;
  preferred_family_names: Record<string, string>;
  style_name: string;
  style_names: Record<string, string>;
  preferred_style_names: Record<string, string>;
  publishers: Record<string, string>;
  designers: Record<string, string>;
  weight: number;
  weights: string[];
}

export interface FontclusterSessionConfig {
  preview_text: string;
}

export interface FontclusterBridgeData {
  session?: FontclusterSessionConfig | null;
  font?: FontclusterFontMetadata | null;
  modified_date?: string | null;
}
