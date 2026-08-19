import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feedbackApi } from '@/api/feedback'
import { formatDate } from '@/utils/user'

function FeedbackColumn({ title, kind, queryKey, emptyText }) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => (kind === 'bug' ? feedbackApi.listBugs() : feedbackApi.listSuggestions()),
  })

  const removeMutation = useMutation({
    mutationFn: (id) => feedbackApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey[0]] })
    },
  })

  const rows = data?.data ?? []

  return (
    <section className="feedback-column">
      <div className="feedback-column__header">
        <h2 className="feedback-column__title">{title}</h2>
        <span className="feedback-column__count">{data?.total ?? 0}</span>
      </div>

      {isError ? (
        <div className="alert alert-error">Не удалось загрузить сообщения.</div>
      ) : null}

      <div className="feedback-column__list">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="feedback-card feedback-card--skeleton">
                <div className="metric-skeleton" style={{ width: '40%', height: 14 }} />
                <div className="metric-skeleton" style={{ width: '100%', height: 48, marginTop: 10 }} />
              </div>
            ))
          : rows.length
            ? rows.map((item) => (
                <article key={item.id} className="feedback-card">
                  <div className="feedback-card__meta">
                    <span className="feedback-card__user">{item.user}</span>
                    <span className="feedback-card__date">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="feedback-card__message">{item.message}</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm feedback-card__delete"
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(item.id)}
                  >
                    Удалить
                  </button>
                </article>
              ))
            : (
                <p className="feedback-column__empty">{emptyText}</p>
              )}
      </div>
    </section>
  )
}

export default function FeedbackPage() {
  return (
    <div className="page">
      <div className="page-section">
        <div className="feedback-grid">
          <FeedbackColumn
            title="Нововведения"
            kind="suggestion"
            queryKey={['feedback', 'suggestion']}
            emptyText="Предложений пока нет."
          />
          <FeedbackColumn
            title="Баги"
            kind="bug"
            queryKey={['feedback', 'bug']}
            emptyText="Сообщений о багах пока нет."
          />
        </div>
      </div>
    </div>
  )
}
