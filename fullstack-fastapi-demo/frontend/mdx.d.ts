// Type declaration for MDX to suppress TypeScript errors
// This file prevents TypeScript from looking for @types/mdx when MDX is not actively used
declare module '*.mdx' {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

