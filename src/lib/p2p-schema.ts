import { z } from 'zod';

export const createOrderSchema = z.object({
  asset: z.string().min(1, { message: 'Coin is required' }),
  fiat: z.string().min(1, { message: 'Fiat is required' }),
  quantity: z.number().min(1, { message: 'Total quantity is required' }),
  minQuantity: z.number().min(1, { message: 'Minimum amount is required' }),
  maxQuantity: z.number().min(1, { message: 'Maximum amount is required' }),
  remark: z.string().min(1, { message: 'Remark is required' }),
  paymentMethod: z.array(z.string()).min(1, { message: 'Select at least one payment method' }),
}).superRefine((data, ctx) => {
  if (data.maxQuantity <= data.minQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum limit must be greater than minimum',
      path: ['maxQuantity'],
    });
  }
  if (data.maxQuantity > data.quantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum limit cannot exceed total quantity',
      path: ['maxQuantity'],
    });
  }
  if (data.minQuantity > data.quantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum limit cannot exceed total quantity',
      path: ['minQuantity'],
    });
  }
});
