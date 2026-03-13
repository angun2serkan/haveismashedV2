import { FriendList } from "@/components/Friends/FriendList";
import { InviteLink } from "@/components/Friends/InviteLink";

export function FriendsPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-white mb-6">Friends</h1>

      <div className="space-y-6 max-w-lg">
        <InviteLink />
        <FriendList />
      </div>
    </div>
  );
}
