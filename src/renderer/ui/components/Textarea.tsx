import type { TextareaHTMLAttributes } from 'react';

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={`field ${props.className ?? ''}`.trim()} />;
