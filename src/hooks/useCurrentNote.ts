import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useCampaign } from "~/contexts/CampaignContext";
import { useNoteActions } from "./useNoteActions";
import { debounce } from "lodash-es";
import type { CustomBlock } from "convex/notes/editorSpecs";


export const useCurrentNote = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { dmUsername, campaignSlug } = useCampaign();
    const { updateNoteContent } = useNoteActions();

    const routeNoteId = location.pathname.includes('/notes/') && !location.pathname.endsWith('/notes')
        ? location.pathname.split('/notes/')[1]
        : null;

    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(routeNoteId);

    const note = useQuery(convexQuery(api.notes.queries.getNote, selectedNoteId ? { noteId: selectedNoteId as Id<"notes"> } : "skip"));

    const selectNote = useCallback((noteId: Id<"notes"> | null) => {
        setSelectedNoteId(noteId ?? null);
        if (!noteId) {
            navigate({
                to: '/campaigns/$dmUsername/$campaignSlug/notes',
                params: { dmUsername, campaignSlug }
            });
          return;
        }
    
        navigate({
            to: '/campaigns/$dmUsername/$campaignSlug/notes/$noteId',
            params: { dmUsername, campaignSlug, noteId }
        });
    }, [dmUsername, campaignSlug, navigate]);

    useEffect(() => {
        setSelectedNoteId(routeNoteId);
    }, [routeNoteId]);

    const updateCurrentNoteContent = useMemo(
        () => debounce((newContent: CustomBlock[]) => {
            if (!note.data?._id) return;
            updateNoteContent(note.data._id, newContent);
        }, 2000),
        [updateNoteContent, note.data?._id],
    );

    return {
        note,
        noteId: selectedNoteId,
        selectNote,
        updateCurrentNoteContent,
    }
}