import React, { ComponentProps } from 'react';

export const Edit = (props?: ComponentProps<'svg'>) => {
  return (
    <svg width="24" height="25" viewBox="0 0 24 25" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 20.5H21"
        stroke="#727679"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 4.00023C16.8978 3.6024 17.4374 3.37891 18 3.37891C18.2786 3.37891 18.5544 3.43378 18.8118 3.54038C19.0692 3.64699 19.303 3.80324 19.5 4.00023C19.697 4.19721 19.8532 4.43106 19.9598 4.68843C20.0665 4.9458 20.1213 5.22165 20.1213 5.50023C20.1213 5.7788 20.0665 6.05465 19.9598 6.31202C19.8532 6.56939 19.697 6.80324 19.5 7.00023L7 19.5002L3 20.5002L4 16.5002L16.5 4.00023Z"
        stroke="#727679"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
