import * as React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'fragment-outlet': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
	  	'fragment-host': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
