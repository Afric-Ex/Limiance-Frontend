import { CandlestickData, LineData } from "lightweight-charts";

export function calculateSMA(data: CandlestickData[], period: number): LineData[] {
  const result: LineData[] = [];
  
  if (data.length < period) {
    return result;
  }

  // Pre-calculate the sum of the first 'period' elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  
  result.push({
    time: data[period - 1].time,
    value: sum / period,
  });

  // Calculate the rest using a sliding window
  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period].close + data[i].close;
    result.push({
      time: data[i].time,
      value: sum / period,
    });
  }

  return result;
}

export function calculateSingleSMA(
  data: CandlestickData[],
  period: number,
  index: number = data.length - 1
): LineData | null {
  if (index < period - 1 || index >= data.length) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i++) {
    sum += data[i].close;
  }
  return {
    time: data[index].time,
    value: sum / period,
  };
}
