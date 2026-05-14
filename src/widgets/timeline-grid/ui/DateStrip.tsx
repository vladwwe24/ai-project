import { Box, Flex, Text } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Props {
  selectedDate: Date
  onSelect: (date: Date) => void
}

export function DateStrip({ selectedDate, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current.querySelector<HTMLElement>('[data-selected="true"]')
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedDate])

  return (
    <Box
      ref={scrollRef}
      overflowX="auto"
      borderBottomWidth="1px"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}
    >
      <Flex px={2} py={2} gap={1} minW="max-content">
        {days.map(day => {
          const selected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, today)
          return (
            <Flex
              key={day.getDate()}
              data-selected={selected}
              direction="column"
              align="center"
              minW="40px"
              py={1}
              px={1}
              borderRadius="md"
              cursor="pointer"
              bg={selected ? 'blue.500' : 'transparent'}
              color={selected ? 'white' : isToday ? 'blue.500' : 'fg'}
              fontWeight={isToday && !selected ? 'bold' : 'normal'}
              onClick={() => onSelect(day)}
              flexShrink={0}
              userSelect="none"
            >
              <Text fontSize="xs">{DAY_LABELS[day.getDay()]}</Text>
              <Text fontSize="sm" lineHeight={1.4}>{day.getDate()}</Text>
            </Flex>
          )
        })}
      </Flex>
    </Box>
  )
}
