import type { InputHTMLAttributes } from 'react';

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`field ${props.className ?? ''}`.trim()} />;
