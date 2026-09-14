"use client";

import { Button, FileInput, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { BiEdit } from "react-icons/bi";
import { MdOutlineClose, MdOutlinePerson } from "react-icons/md";
import { LimianceAvatarLg } from "../icons/limiance-avatar-lg";
import { useForm } from "@mantine/form";
import { useMutation } from "@tanstack/react-query";
import { userService } from "@/src/services/user";
import { useUserStore } from "@/src/stores/user-store";
import { useEffect, useState } from "react";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import { convertFileToBase64 } from "@/src/lib/convert-file-to-base64";

export const EditProfile = () => {
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);

  const { mutate, isPending } = useMutation({
    mutationFn: userService.updateUser,
    onSuccess() {
      if (user)
        setUser({
          ...user,
          username: form.values.username || user.username,
          photo: form.values.photo || user.photo,
        });
      successNotification("Profile updated successfully");
      modals.closeAll();
    },
    onError(err) {
      errorMessageHandler(err);
    },
  });

  const form = useForm({
    initialValues: {
      username: "",
      phone: "",
      password: "",
      photo: "",
      firstName: "",
      lastName: "",
      country: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    form.setFieldValue("username", user?.username as string);
  }, [user]);

  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="w-full max-w-[520px] flex flex-col gap-6 bg-[#181a20] rounded-2xl p-8 border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <MdOutlinePerson size={20} />
          </div>
          <h4 className="text-xl font-bold text-white">Edit Profile</h4>
        </div>
        <button
          onClick={() => modals.closeAll()}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <label className="relative cursor-pointer group shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/[0.1] group-hover:border-primary/50 transition-colors">
              {form.values.photo ? (
                <img src={form.values.photo} alt="user picture" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/15 flex items-center justify-center">
                  <LimianceAvatarLg />
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <BiEdit size={20} className="text-white" />
            </div>
            <FileInput
              value={file}
              hidden
              accept="image/png,image/jpeg,image/jpg"
              onChange={async (val) => {
                if (!val) return;
                setFile(val);
                const base64 = await convertFileToBase64(val);
                form.setFieldValue("photo", base64);
              }}
            />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-white">Profile Photo</span>
            <span className="text-xs font-medium text-white/40 leading-relaxed">
              Click the avatar to upload a new photo.
              <br />Avatar can only be changed after 30 days.
            </span>
          </div>
        </div>

        {/* Nickname Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/60">Nickname</label>
          <TextInput
            classNames={{
              input:
                "!bg-transparent !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[52px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20",
              section: "!w-fit !right-4",
              error: "!mt-1.5 !text-xs !text-error-1",
            }}
            placeholder="Enter your nickname"
            maxLength={40}
            rightSection={
              <span className="text-xs font-bold text-white/30">
                {form.values.username.length}/40
              </span>
            }
            error={
              form.values.username.length > 0 && form.values.username.length < 4
                ? "Username must be at least 4 characters"
                : null
            }
            {...form.getInputProps("username")}
          />
          <span className="text-xs font-medium text-white/30">
            Nickname can only be changed after 30 days.
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <Button
          onClick={() => modals.closeAll()}
          className="!h-[52px] !rounded-xl !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !font-bold !transition-all active:!scale-[0.98]"
        >
          Cancel
        </Button>
        <Button
          className="!h-[52px] !rounded-xl !bg-primary hover:!bg-primary/90 hover:!shadow-[0_0_16px_rgba(77,119,240,0.3)] !text-white !font-bold !transition-all active:!scale-[0.98] disabled:!opacity-50"
          disabled={!form.values.username || form.values.username.length < 4}
          onClick={() => mutate(form.values)}
          loading={isPending}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};
