import type { SVGProps } from "react";

export default function EnFlag(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            {...props}
        >
            <rect
                width="30"
                height="24"
                x="1"
                y="4"
                fill="#071b65"
                rx="4"
                ry="4"
            />
            <path
                fill="#fff"
                d="M5.101 4H5a3.992 3.992 0 0 0-3.933 3.334L26.899 28H27a3.992 3.992 0 0 0 3.933-3.334L5.101 4Z"
            />
            <path
                fill="#b92932"
                d="M22.25 19h-2.5l9.934 7.947c.387-.353.704-.777.929-1.257l-8.363-6.691ZM1.387 6.309 9.75 13h2.5L2.316 5.053a3.996 3.996 0 0 0-.929 1.257Z"
            />
            <path
                fill="#fff"
                d="M5 28h.101L30.933 7.334A3.991 3.991 0 0 0 27 4h-.101L1.067 24.666A3.991 3.991 0 0 0 5 28Z"
            />
            <path
                fill="#fff"
                d="M13 4h6v24h-6z"
            />
            <path
                fill="#fff"
                d="M1 13h30v6H1z"
            />
            <path
                fill="#b92932"
                d="M14 4h4v24h-4z"
            />
            <path
                fill="#b92932"
                d="M31 14v4H1v-4zM28.222 4.21 19 11.586V13h.75l9.943-7.94a3.98 3.98 0 0 0-1.471-.85ZM2.328 26.957a3.98 3.98 0 0 0 1.447.832L13 20.409v-1.408h-.75l-9.922 7.956Z"
            />
            <path
                d="M27 4H5a4 4 0 0 0-4 4v16a4 4 0 0 0 4 4h22a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4Zm3 20c0 1.654-1.346 3-3 3H5c-1.654 0-3-1.346-3-3V8c0-1.654 1.346-3 3-3h22c1.654 0 3 1.346 3 3v16Z"
                opacity=".15"
            />
            <path
                fill="#fff"
                d="M27 5H5a3 3 0 0 0-3 3v1a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3V8a3 3 0 0 0-3-3Z"
                opacity=".2"
            />
        </svg>
    );
}
