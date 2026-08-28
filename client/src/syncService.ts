import type { LocalProject } from "@/localStore";
import { supabase } from "@/supabaseClient";
export type SyncSnapshot = {
  project: LocalProject;
  updatedAt: string;
};
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}
export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
export async function readRemoteSnapshot(userId: string): Promise<SyncSnapshot | null> {
  const { data, error } = await supabase
    .from("project_snapshots")
    .select("project, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { project: data.project as LocalProject, updatedAt: data.updated_at as string };
}
export async function writeRemoteSnapshot(userId: string, project: LocalProject) {
  const { error } = await supabase.from("project_snapshots").upsert(
    { user_id: userId, project, version: 1 },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
