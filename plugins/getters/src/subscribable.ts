export default function() {
  let subject
	const subs = new Set()
	const onReady = (nextSubject) => {
		subs.forEach(sub => sub(nextSubject))
		subject = nextSubject
		subs.clear()
	}
	const ready = (next) => {
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
