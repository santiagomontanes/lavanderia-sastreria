import type { SelectHTMLAttributes } from 'react';

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`field ${props.className ?? ''}`.trim()} />;
