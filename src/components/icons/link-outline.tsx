import React, { ComponentProps } from 'react';

export const LinkOutine = (props?: ComponentProps<'svg'>) => {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_1675_39442)">
        <path
          d="M17.1556 15.0725L17.1869 18.0723C17.1938 18.7289 17.0712 19.3804 16.8263 19.9896C16.5814 20.5988 16.2188 21.1538 15.7594 21.6229C15.3 22.0921 14.7527 22.4661 14.1487 22.7237C13.5447 22.9813 12.8959 23.1174 12.2393 23.1242C11.5828 23.1311 10.9313 23.0085 10.3221 22.7636C9.71285 22.5187 9.15784 22.1561 8.68873 21.6967C8.21961 21.2373 7.84558 20.69 7.58799 20.086C7.3304 19.482 7.1943 18.8332 7.18745 18.1767L7.15615 15.1768M7.09354 9.17715L7.06224 6.17731C7.05539 5.52074 7.17792 4.86925 7.42285 4.26003C7.66778 3.65081 8.03031 3.0958 8.48973 2.62669C9.41758 1.67928 10.6838 1.13925 12.0098 1.12541C13.3358 1.11158 14.613 1.62506 15.5604 2.55291C16.5078 3.48076 17.0479 4.74696 17.0617 6.07297L17.093 9.07281"
          stroke="#727679"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.0828 8.125L12.1662 16.1246"
          stroke="#727679"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1675_39442">
          <rect
            width="24"
            height="24"
            fill="white"
            transform="translate(23.9987) rotate(89.4021)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
