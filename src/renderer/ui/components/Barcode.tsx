import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

type BarcodeProps = {
  value: string;
  height?: number;
  width?: number;
  displayValue?: boolean;
};

export const Barcode = ({
  value,
  height = 60,
  width = 2,
  displayValue = true
}: BarcodeProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value?.trim()) return;

    JsBarcode(svgRef.current, value, {
      format: 'CODE128',
      lineColor: '#111827',
      background: '#ffffff',
      width,
      height,
      displayValue,
      margin: 0
    });
  }, [value, height, width, displayValue]);

  return <svg ref={svgRef} />;
};