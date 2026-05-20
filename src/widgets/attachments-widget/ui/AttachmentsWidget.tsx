import { Box, Flex, Grid, IconButton, Image, Text } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { MdCameraAlt, MdDelete, MdUpload } from 'react-icons/md'
import { useAppDispatch, useAppState } from '@/app/providers/AppProvider'
import { selectJobById } from '@/entities/job/model/slice'
import type { Attachment } from '@/entities/job/model/types'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { AppModal } from '@/shared/ui/AppModal'
import { nanoid } from '@/shared/lib/index'

interface Props {
  jobId: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AttachmentsWidget({ jobId }: Props) {
  const { jobs } = useAppState()
  const dispatch = useAppDispatch()
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const job = selectJobById(jobs, jobId)
  const attachments = job?.attachments ?? []

  async function handleFiles(files: FileList | null) {
    if (!files || !job) return
    const newAttachments: Attachment[] = []
    for (const file of Array.from(files)) {
      const dataUrl = await readFileAsDataUrl(file)
      newAttachments.push({ id: nanoid(), dataUrl, createdAt: new Date().toISOString() })
    }
    dispatch({
      type: 'job/UPDATE',
      payload: {
        ...job,
        attachments: [...attachments, ...newAttachments],
        updatedAt: new Date().toISOString(),
      },
    })
  }

  function handleDelete() {
    if (!job || !deleteTarget) return
    dispatch({
      type: 'job/UPDATE',
      payload: {
        ...job,
        attachments: attachments.filter(a => a.id !== deleteTarget),
        updatedAt: new Date().toISOString(),
      },
    })
    setDeleteTarget(null)
  }

  return (
    <Box borderRadius="xl" boxShadow="sm" overflow="hidden" style={{ background: 'var(--app-surface)' }}>
      <Flex align="center" px={4} py={3} borderBottomWidth={attachments.length > 0 ? '1px' : '0'} borderColor="border.subtle">
        <Text fontWeight="semibold" flex={1}>Attachments</Text>
        <IconButton
          aria-label="Upload image"
          variant="ghost"
          size="sm"
          onClick={() => uploadRef.current?.click()}
        >
          <MdUpload />
        </IconButton>
        <IconButton
          aria-label="Take photo"
          variant="ghost"
          size="sm"
          onClick={() => cameraRef.current?.click()}
        >
          <MdCameraAlt />
        </IconButton>
      </Flex>

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />

      {attachments.length === 0 ? (
        <Box px={4} py={3}>
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={2}
            py={4}
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="border.subtle"
            borderRadius="lg"
            cursor="pointer"
            color="fg.muted"
            onClick={() => cameraRef.current?.click()}
          >
            <MdCameraAlt size={24} />
            <Text fontSize="sm">Use our camera to capture photos and videos</Text>
          </Flex>
        </Box>
      ) : (
        <Grid templateColumns="repeat(3, 1fr)" gap={1} p={2}>
          {attachments.map(attachment => (
            <Box
              key={attachment.id}
              position="relative"
              aspectRatio="1"
              overflow="hidden"
              borderRadius="md"
              cursor="pointer"
              onClick={() => setPreviewAttachment(attachment)}
            >
              <Image
                src={attachment.dataUrl}
                alt="attachment"
                w="full"
                h="full"
                objectFit="cover"
              />
              <IconButton
                aria-label="Delete"
                position="absolute"
                top={1}
                right={1}
                size="2xs"
                colorPalette="red"
                variant="solid"
                onClick={e => { e.stopPropagation(); setDeleteTarget(attachment.id) }}
              >
                <MdDelete />
              </IconButton>
            </Box>
          ))}
        </Grid>
      )}

      <AppModal
        open={previewAttachment !== null}
        onClose={() => setPreviewAttachment(null)}
        title="Photo"
        size="lg"
      >
        {previewAttachment && (
          <Image
            src={previewAttachment.dataUrl}
            alt="attachment preview"
            w="full"
            borderRadius="md"
          />
        )}
      </AppModal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Photo"
        message="Remove this photo? This cannot be undone."
        confirmLabel="Delete"
      />
    </Box>
  )
}
