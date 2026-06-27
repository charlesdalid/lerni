export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#ede8f5]">
      {children}
    </div>
  )
}
