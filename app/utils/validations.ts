import { z } from "zod";

export const LogSchema = z.object({
  weight: z.number().positive(),
  type: z.enum(["PRODUCTION", "WASTE"]),
  itemId: z.string().uuid(),
  potId: z.string().uuid(),
});

export const ItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cogs: z.number().min(0),
  user: z.object({ connect: z.object({ id: z.string().uuid() }) }),
});

export const PotSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().positive(),
  weight: z.number(),
  imgUrl: z.string().optional(),
  user: z.object({ connect: z.object({ id: z.string().uuid() }) }),
});