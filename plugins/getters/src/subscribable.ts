export default function() {
  let subject
	const subs = new Set()
	const ready = (nextSubject) => {
    subject = nextSubject
		subs.forEach(sub => sub(nextSubject))
		subs.clear()
	}
	const onReady = (next) => {
		if (!subject) {
			subs.add(next)
			return () => subs.delete(next)
		}

		return next(subject)
	}

  return {
    ready,
    onReady
  }
}
