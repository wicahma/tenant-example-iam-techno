"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import { useUsers } from "@/hooks/useUsers";

export default function UsersPage() {
  const { users, pagination, loading, search, setSearch, fetchUsers } =
    useUsers();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers({ page, limit: 10 });
  }, [page, fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers({ page: 1, limit: 10, search: search || undefined });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers({ page: newPage, limit: 10, search: search || undefined });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Card
        title="User List"
        description="GET /public/users — Paginated user list with search and filter."
      >
        {/* Search */}
        <div className="mb-6 flex gap-2">
          <Input
            placeholder="Search by name, email, or NPK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <PageSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No users found.</p>
            <p className="mt-1 text-sm">
              {search
                ? "Try a different search term."
                : "No users associated with this tenant."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                    <th className="py-3 pr-4 font-medium text-gray-500">ID</th>
                    <th className="py-3 pr-4 font-medium text-gray-500">NPK</th>
                    <th className="py-3 pr-4 font-medium text-gray-500">
                      Full Name
                    </th>
                    <th className="py-3 pr-4 font-medium text-gray-500">
                      Email
                    </th>
                    <th className="py-3 pr-4 font-medium text-gray-500">
                      Phone
                    </th>
                    <th className="py-3 pr-4 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="py-3 font-medium text-gray-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                    >
                      <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                        {user.id}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-900 dark:text-gray-100">
                        {user.npk}
                      </td>
                      <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                        {user.fullName}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                        {user.email || "—"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                        {user.phoneNumber || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={user.isActive ? "success" : "danger"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="mt-6">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  hasPrev={pagination.hasPrev}
                  hasNext={pagination.hasNext}
                  total={pagination.total}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Raw Response */}
      <Card title="Raw Response" className="mt-6">
        <pre className="max-h-64 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
          {JSON.stringify({ users, pagination }, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
