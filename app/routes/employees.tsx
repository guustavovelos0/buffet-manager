import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { requireManager } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { useState, useEffect } from "react";

const CreateEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const manager = await requireManager(request);
  
  const employees = await prisma.user.findMany({
    where: {
      managerId: manager.id,
      role: "EMPLOYEE",
    },
    select: {
      id: true,
      email: true,
    },
  });

  return json({ employees });
}

export async function action({ request }: ActionFunctionArgs) {
  const manager = await requireManager(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const employeeId = formData.get("employeeId") as string;
    await prisma.user.delete({
      where: { id: employeeId },
    });
    return json({ success: true });
  }

  if (intent === "create") {
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const data = CreateEmployeeSchema.parse({ email, password });
      
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return json({ error: "User already exists" }, { status: 400 });
      }

      await prisma.user.create({
        data: {
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
          role: "EMPLOYEE",
          managerId: manager.id,
        },
      });

      return json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return json({ error: error.errors[0].message }, { status: 400 });
      }
      return json({ error: "Server error" }, { status: 500 });
    }
  }
}

export default function Employees() {
  const { employees } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      setIsModalOpen(false);
    }
  }, [actionData]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Manage Employees</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Employee
            </button>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Add New Employee</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <Form 
                  method="post" 
                  className="space-y-4"
                >
                  <input type="hidden" name="intent" value="create" />
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  {actionData && 'error' in actionData && (
                    <p className="text-red-500 text-sm">{actionData.error}</p>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add Employee
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          )}

          {/* Employees List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Employees</h3>
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <span className="text-sm font-medium text-gray-900">{employee.email}</span>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="employeeId" value={employee.id} />
                    <button
                      type="submit"
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </Form>
                </div>
              ))}
              {employees.length === 0 && (
                <p className="text-gray-500">No employees yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 