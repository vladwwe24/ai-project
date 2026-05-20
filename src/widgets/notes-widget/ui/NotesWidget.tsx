import { Box, Button, Flex, IconButton, Text, Textarea } from '@chakra-ui/react'
import { useState } from 'react'
import { MdAdd, MdClose, MdDescription, MdDelete, MdUnfoldMore } from 'react-icons/md'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { selectJobById } from '@/entities/job/model/slice'
import type { Note } from '@/entities/job/model/types'
import { nanoid, formatDate, formatTime } from '@/shared/lib/index'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

interface Props {
  jobId: string
}

export function NotesWidget({ jobId }: Props) {
  const { jobs } = useAppState()
  const dispatch = useAppDispatch()
  const job = selectJobById(jobs, jobId)
  const notes: Note[] = job?.notes ?? []

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const editingNote = editingId ? notes.find(n => n.id === editingId) ?? null : null
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null

  function openEdit(note: Note) {
    setEditingId(note.id)
    setEditBody(note.body)
  }

  function openNew() {
    const id = nanoid()
    const now = new Date().toISOString()
    const newNote: Note = { id, body: '', createdAt: now, updatedAt: now }
    const updated = [...notes, newNote]
    saveNotes(updated)
    setEditingId(id)
    setEditBody('')
  }

  function closeEdit() {
    setEditingId(null)
    setEditBody('')
  }

  function saveNotes(updated: Note[]) {
    if (!job) return
    dispatch({
      type: 'job/UPDATE',
      payload: { ...job, notes: updated, updatedAt: new Date().toISOString() },
    })
  }

  function handleSave() {
    if (!editingId) return
    const now = new Date().toISOString()
    const updated = notes.map(n =>
      n.id === editingId ? { ...n, body: editBody, updatedAt: now } : n,
    )
    saveNotes(updated)
    closeEdit()
  }

  function handleDelete(id: string) {
    saveNotes(notes.filter(n => n.id !== id))
    if (editingId === id) closeEdit()
    setDeleteTargetId(null)
  }

  // Expanded edit view
  if (editingId) {
    return (
      <Box boxShadow="sm" borderRadius="xl" overflow="hidden">
        <Flex
          align="center"
          px={3}
          py={2}
          borderBottomWidth="1px"
          borderColor="border.subtle"
          gap={2}
        >
          <IconButton aria-label="Close" size="xs" variant="ghost" onClick={closeEdit}>
            <MdClose />
          </IconButton>
          <Text fontWeight="semibold" flex={1} textAlign="center" fontSize="sm">
            Edit note
          </Text>
          <IconButton
            aria-label="Delete note"
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => editingId && setDeleteTargetId(editingId)}
          >
            <MdDelete />
          </IconButton>
          <Button size="xs" colorPalette="blue" onClick={handleSave}>
            Save
          </Button>
        </Flex>
        <Box p={3}>
          {editingNote && (
            <Text fontSize="xs" color="fg.muted" mb={2}>
              {formatDate(editingNote.createdAt)} {formatTime(editingNote.createdAt)}
            </Text>
          )}
          <Textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            placeholder="Write your note…"
            rows={8}
            autoFocus
          />
        </Box>
      </Box>
    )
  }

  // Collapsed view
  return (
    <Box boxShadow="sm" borderRadius="xl" p={3}>
      <Flex align="center" gap={2} mb={notes.length > 0 ? 2 : 0}>
        <MdDescription color="var(--chakra-colors-fg-muted)" />
        <Text fontWeight="semibold" flex={1} fontSize="sm">Private notes</Text>
        {latestNote && (
          <IconButton
            aria-label="Expand notes"
            size="xs"
            variant="ghost"
            onClick={() => openEdit(latestNote)}
          >
            <MdUnfoldMore />
          </IconButton>
        )}
        <IconButton
          aria-label="Add note"
          size="xs"
          variant="ghost"
          colorPalette="blue"
          onClick={openNew}
        >
          <MdAdd />
        </IconButton>
      </Flex>

      {notes.length === 0 && (
        <Text fontSize="sm" color="fg.muted">No notes yet. Tap + to add one.</Text>
      )}

      {notes.map(note => (
        <Box
          key={note.id}
          cursor="pointer"
          borderRadius="sm"
          px={1}
          py={1.5}
          mb={1}
          _hover={{ bg: 'bg.subtle' }}
          onClick={() => openEdit(note)}
          _last={{ mb: 0 }}
        >
          <Text fontSize="xs" color="fg.muted" mb={0.5}>
            {formatDate(note.createdAt)}, {formatTime(note.createdAt)}
          </Text>
          <Text fontSize="sm" color="fg.default" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {note.body || <Text as="span" color="fg.muted" fontStyle="italic">Empty note</Text>}
          </Text>
        </Box>
      ))}

      <ConfirmDialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
        title="Delete Note"
        message="Delete this note? This cannot be undone."
        confirmLabel="Delete"
      />
    </Box>
  )
}
