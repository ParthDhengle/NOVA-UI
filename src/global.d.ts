// global.d.ts (create this in `src/` if not present)
import 'react';

declare module 'react' {
  interface CSSProperties {
    ['-webkit-app-region']?: 'drag' | 'no-drag';
  }
}
