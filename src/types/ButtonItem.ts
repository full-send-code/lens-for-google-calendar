
export interface ButtonItem {
  text: string;
  tooltip: string;
  click: () => Promise<void>;
}
