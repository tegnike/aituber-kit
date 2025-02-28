declare module '@charcoal-ui/icons' {
  export interface KnownIconType {
    [key: string]: string
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    'pixiv-icon': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        name: string
        scale: string
      },
      HTMLElement
    >
  }
}
