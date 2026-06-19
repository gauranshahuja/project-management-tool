import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCopy,
  FiMail,
  FiTrash2,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import axios from "../services/axiosInstance";
import Navbar_Dashboard from "../components/Navbar_dashboard";
import { getStoredUser } from "../utils/authStorage";
import { getEntityId } from "../utils/ids";
import { getSocket } from "../utils/socket";
import { useConfirm } from "../components/ConfirmDialog";

const INVITE_ROLES = ["Member", "Manager", "Admin"];

const getErrorMessage = (err, fallback) =>
  err.response?.data?.error || err.response?.data?.message || fallback;

const roleBadgeClasses = {
  Owner:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  Admin:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-200",
  Manager:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Member:
    "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
};

const MembersSkeleton = () => (
  <div className="divide-y divide-gray-200 dark:divide-gray-700">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    ))}
  </div>
);

const EmptyMembers = () => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
      <FiUsers aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
      No members found
    </h3>
    <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
      Invite teammates to start assigning work across your organization.
    </p>
  </div>
);

const Members = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const currentUser = getStoredUser();
  const currentUserId = getEntityId(currentUser);
  const isAdmin = ["Owner", "Admin"].includes(currentUser?.role);
  const isOwner = currentUser?.role === "Owner";

  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "Member" });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [copyFallback, setCopyFallback] = useState(null);
  const [busyInviteId, setBusyInviteId] = useState("");
  const [busyMemberId, setBusyMemberId] = useState("");
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const requests = [axios.get("/org"), axios.get("/org/members")];
      if (isAdmin) requests.push(axios.get("/org/invites"));

      const [orgRes, membersRes, invitesRes] = await Promise.all(requests);

      setOrg(orgRes.data);
      setMembers(membersRes.data);
      if (invitesRes) setInvites(invitesRes.data);
    } catch (err) {
      console.error("Failed to load members:", err.response?.data || err.message);
      setError(getErrorMessage(err, "Failed to load organization"));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!currentUser?.token) {
      navigate("/");
      return;
    }

    loadAll();
  }, [currentUser?.token, loadAll, navigate]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const handlePresence = (payload) => {
      setOnlineIds(new Set((payload?.online || []).map((id) => getEntityId(id))));
    };

    socket.on("presence:update", handlePresence);

    return () => {
      socket.off("presence:update", handlePresence);
    };
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setCopyFallback(null);

    if (!inviteForm.email.trim()) {
      setError("Email is required.");
      return;
    }

    setSendingInvite(true);

    try {
      const res = await axios.post("/org/invites", {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      });

      setInvites((prev) => [res.data, ...prev]);
      setInviteForm({ email: "", role: "Member" });
      setNotice(`Invite created for ${res.data.email}. Copy the link and share it.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create invite"));
    } finally {
      setSendingInvite(false);
    }
  };

  const copyInviteLink = async (invite) => {
    const link = `${window.location.origin}/join?token=${invite.token}`;
    setCopyFallback(null);

    try {
      await navigator.clipboard.writeText(link);
      setNotice(`Invite link copied for ${invite.email}.`);
      setError("");
    } catch {
      setNotice("");
      setCopyFallback({ inviteId: invite.id, link });
    }
  };

  const revokeInvite = async (invite) => {
    const confirmed = await confirm({
      title: "Revoke invite?",
      message: `${invite.email} will no longer be able to join with this link.`,
      confirmText: "Revoke",
      danger: true,
    });

    if (!confirmed) return;

    setError("");
    setNotice("");
    setCopyFallback(null);
    setBusyInviteId(invite.id);

    try {
      await axios.delete(`/org/invites/${invite.id}`);
      setInvites((prev) => prev.filter((item) => item.id !== invite.id));
      setNotice("Invite revoked.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to revoke invite"));
    } finally {
      setBusyInviteId("");
    }
  };

  const changeRole = async (member, role) => {
    if (member.role === role) return;

    const memberId = getEntityId(member);
    setError("");
    setNotice("");
    setCopyFallback(null);
    setBusyMemberId(memberId);

    try {
      const res = await axios.patch(`/org/members/${member.id}/role`, { role });
      setMembers((prev) =>
        prev.map((item) =>
          getEntityId(item) === getEntityId(member) ? res.data : item
        )
      );
      setNotice(`${res.data.name} is now ${res.data.role}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to change role"));
    } finally {
      setBusyMemberId("");
    }
  };

  const removeMember = async (member) => {
    const confirmed = await confirm({
      title: "Remove member?",
      message: `${member.name} will lose access to this organization.`,
      confirmText: "Remove",
      danger: true,
    });

    if (!confirmed) return;

    setError("");
    setNotice("");
    setCopyFallback(null);
    setBusyMemberId(getEntityId(member));

    try {
      await axios.delete(`/org/members/${member.id}`);
      setMembers((prev) =>
        prev.filter((item) => getEntityId(item) !== getEntityId(member))
      );
      setNotice(`${member.name} removed.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove member"));
    } finally {
      setBusyMemberId("");
    }
  };

  // Mirrors backend role-management rules for member controls.
  const canEditMember = (member) => {
    if (!isAdmin) return false;
    if (getEntityId(member) === currentUserId) return false;
    if (member.role === "Owner") return false;
    if (!isOwner && member.role === "Admin") return false;
    return true;
  };

  const roleOptionsFor = () => (isOwner ? INVITE_ROLES : ["Member", "Manager"]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <Navbar_Dashboard />

      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800 dark:text-white">
              <FiUsers aria-hidden="true" /> Team
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {org ? `${org.name} - ${org.memberCount} member${org.memberCount === 1 ? "" : "s"}` : "Loading organization..."}
            </p>
          </div>
        </div>

        {(error || notice) && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            }`}
          >
            {error || notice}
          </div>
        )}

        {isAdmin && (
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
              <FiUserPlus aria-hidden="true" /> Invite a teammate
            </h2>
            <form
              onSubmit={handleInvite}
              className="mt-3 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="teammate@company.com"
                required
                disabled={sendingInvite}
                className="min-w-0 flex-1 rounded border px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <select
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, role: e.target.value }))
                }
                disabled={sendingInvite}
                className="rounded border px-4 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {roleOptionsFor().map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={sendingInvite}
                className="rounded bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {sendingInvite ? "Creating..." : "Create invite"}
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              An invite link is generated - copy it and share it with your
              teammate. Links expire in 7 days.
            </p>
          </section>
        )}

        {isAdmin && invites.length > 0 && (
          <section className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="flex items-center gap-2 border-b border-gray-200 p-4 text-lg font-semibold text-gray-800 dark:border-gray-700 dark:text-white">
              <FiMail aria-hidden="true" /> Pending invites
            </h2>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-3 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-gray-800 dark:text-white">
                        {invite.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        as {invite.role} - expires{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => copyInviteLink(invite)}
                        disabled={busyInviteId === invite.id}
                        className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <FiCopy aria-hidden="true" /> Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeInvite(invite)}
                        disabled={busyInviteId === invite.id}
                        className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                      >
                        <FiX aria-hidden="true" />
                        {busyInviteId === invite.id ? "Revoking" : "Revoke"}
                      </button>
                    </div>
                  </div>
                  {copyFallback?.inviteId === invite.id && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                      <p className="mb-2 text-xs text-amber-800 dark:text-amber-200">
                        Clipboard access is blocked. Select and copy this link manually.
                      </p>
                      <input
                        readOnly
                        value={copyFallback.link}
                        onFocus={(event) => event.target.select()}
                        className="w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-amber-800 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="border-b border-gray-200 p-4 text-lg font-semibold text-gray-800 dark:border-gray-700 dark:text-white">
            Members
          </h2>
          {loading ? (
            <MembersSkeleton />
          ) : members.length === 0 ? (
            <EmptyMembers />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium text-gray-800 dark:text-white">
                      {member.name}
                      {getEntityId(member) === currentUserId && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                      {onlineIds.has(getEntityId(member)) && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      )}
                    </p>
                    <p className="break-words text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {canEditMember(member) ? (
                      <select
                        value={member.role}
                        onChange={(e) => changeRole(member, e.target.value)}
                        disabled={busyMemberId === getEntityId(member)}
                        className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        {roleOptionsFor().map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          roleBadgeClasses[member.role] || roleBadgeClasses.Member
                        }`}
                      >
                        {member.role}
                      </span>
                    )}

                    {canEditMember(member) && (
                      <button
                        type="button"
                        onClick={() => removeMember(member)}
                        disabled={busyMemberId === getEntityId(member)}
                        className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                      >
                        <FiTrash2 aria-hidden="true" />
                        {busyMemberId === getEntityId(member) ? "Working" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Members;
