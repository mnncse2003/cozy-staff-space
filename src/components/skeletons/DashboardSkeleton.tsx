import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/** Generic list skeleton - rows with icon + text */
export const ListSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

/** Generic table skeleton */
export const TableSkeleton = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-4 p-2 border-b">
      {[...Array(cols)].map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-2">
        {[...Array(cols)].map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

/** Card-based loading skeleton */
export const CardSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
);

/** Full page loading skeleton */
export const PageSkeleton = () => (
  <div className="space-y-4 p-4 sm:p-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <ListSkeleton rows={6} />
      </CardContent>
    </Card>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Card className="border-0">
      <CardHeader className="pb-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex flex-col items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const LeaveTabSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </CardHeader>
      <CardContent><ListSkeleton rows={5} /></CardContent>
    </Card>
  </div>
);

export const AttendanceTabSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (<Skeleton key={`h-${i}`} className="h-6 w-full" />))}
          {[...Array(35)].map((_, i) => (<Skeleton key={i} className="h-10 w-full rounded" />))}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
      <CardContent><TableSkeleton rows={5} cols={5} /></CardContent>
    </Card>
  </div>
);

export const ProfileTabSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 text-center sm:text-left">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const SalaryTabSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </CardHeader>
      <CardContent><ListSkeleton rows={6} /></CardContent>
    </Card>
  </div>
);

export const ChatPageSkeleton = () => (
  <div className="flex h-full w-full">
    <div className="w-80 border-r space-y-2 p-3">
      <Skeleton className="h-9 w-full rounded-md" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex-1" />
      <div className="p-3 border-t"><Skeleton className="h-10 w-full rounded-md" /></div>
    </div>
  </div>
);

/** Attendance records list skeleton */
export const AttendanceRecordsSkeleton = () => (
  <div className="space-y-3 py-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    ))}
  </div>
);

/** Helpdesk tickets skeleton */
export const HelpdeskSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
);

/** HR Analytics page skeleton */
export const HRAnalyticsSkeleton = () => (
  <div className="space-y-4 p-4 sm:p-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full rounded-lg" /></CardContent>
        </Card>
      ))}
    </div>
  </div>
);

/** Department list skeleton */
export const DepartmentSkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="p-4 border rounded-lg">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-3 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/** Shift list skeleton */
export const ShiftSkeleton = () => (
  <div className="space-y-3 py-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    ))}
  </div>
);

/** Employee details page skeleton */
export const EmployeeDetailsSkeleton = () => (
  <div className="space-y-4 p-4 sm:p-6">
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

/** Exit section (clearance/resignation/settlement) skeleton */
export const ExitCardSkeleton = () => (
  <Card>
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/** Menu access control skeleton */
export const MenuAccessSkeleton = () => (
  <div className="space-y-3 py-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-10 rounded-full" />
      </div>
    ))}
  </div>
);

/** Account page skeleton */
export const AccountSkeleton = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Card className="w-full max-w-lg">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <div className="space-y-3 pt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

/** Leave type settings skeleton */
export const LeaveTypeSettingsSkeleton = () => (
  <div className="space-y-4 py-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    ))}
  </div>
);
