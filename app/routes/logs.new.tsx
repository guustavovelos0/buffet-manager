import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { LogSchema } from "~/utils/validations";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const [items, pots] = await Promise.all([
    prisma.item.findMany(),
    prisma.pot.findMany(),
  ]);
  return json({ items, pots });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  
  try {
    const data = LogSchema.parse({
      weight: Number(formData.get("weight")),
      type: formData.get("type"),
      itemId: formData.get("itemId"),
      potId: formData.get("potId"),
    });

    await prisma.log.create({
      data: {
        ...data,
        userId: user.id,
      },
    });
    return json({ success: true });
  } catch (error) {
    return json({ error: "Invalid form data" }, { status: 400 });
  }
}

export default function NewLog() {
  const { items, pots } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Log Food Production/Waste</h1>
      <Form method="post" className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            name="type"
            id="type"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="PRODUCTION">Production</option>
            <option value="WASTE">Waste</option>
          </select>
        </div>
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            id="weight"
            step="0.1"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="itemId" className="block text-sm font-medium text-gray-700">
            Item
          </label>
          <select
            name="itemId"
            id="itemId"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="potId" className="block text-sm font-medium text-gray-700">
            Pot
          </label>
          <select
            name="potId"
            id="potId"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            {pots.map((pot) => (
              <option key={pot.id} value={pot.id}>
                {pot.name} (-{pot.weight}kg)
              </option>
            ))}
          </select>
        </div>
        {actionData && 'error' in actionData && (
          <p className="text-red-500 text-sm">{actionData.error}</p>
        )}
        {actionData && 'success' in actionData && (
          <p className="text-green-500 text-sm">Log created successfully!</p>
        )}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Create Log
        </button>
      </Form>
    </div>
  );
}