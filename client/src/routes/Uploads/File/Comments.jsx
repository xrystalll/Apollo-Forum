import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { useForm } from 'hooks/useForm';

import { BACKEND, Strings } from 'support/Constants';
import Socket from 'support/Socket';

import { SectionHeader } from 'components/Section';
import FormCardItem from 'components/Card/FormCardItem';
import Input from 'components/Form/Input';
import Loader from 'components/Loader';
import Errorer from 'components/Errorer';

import CommentItem from './CommentItem';

const Comments = ({ lang, user, token, fileId, subcribed, clearSubcribe }) => {
  const [init, setInit] = useState(true)
  const [comments, setComments] = useState([])
  const pagination = false
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await fetch(`${BACKEND}/api/file/comments?fileId=${fileId}&pagination=${pagination}`)
        const response = await data.json()

        if (!response.error) {
          setInit(false)
          setComments(response.docs)
          setLoading(false)
        } else throw Error(response.error?.message || 'Error')
      } catch(err) {
        setInit(false)
        setLoading(false)
      }
    }

    init && fetchComments()
  }, [init])

  useEffect(() => {
    if (!subcribed.type) return

    if (subcribed.type === 'commentCreated') {
      setComments(prev => [...prev, subcribed.payload])
      if (user && user.id === subcribed.payload.author._id) {
        window.scrollTo(0, document.body.scrollHeight)
      }
    }
    if (subcribed.type === 'commentDeleted') {
      setComments(prev => prev.filter(item => item._id !== subcribed.payload.id))
    }
    if (subcribed.type === 'commentLiked') {
      let newArray = [...comments]
      newArray[newArray.findIndex(item => item._id === subcribed.payload._id)] = subcribed.payload

      setComments(newArray)
    }

    clearSubcribe({})
  }, [comments, subcribed])

  const [commentedTo, setCommentedTo] = useState({ text: '', id: null })
  const [errors, setErrors] = useState({})

  const createCommentCallback = () => {
    if (!values.body.trim()) {
      return setErrors({ body: Strings.enterContent[lang] })
    }

    setCommentedTo({ text: '', id: null })
    reset()
    createComment()
  }

  const { onChange, addValue, onSubmit, values, reset } = useForm(createCommentCallback, {
    body: ''
  })

  useEffect(() => {
    addValue({ name: 'body', value: commentedTo.text + values.body })
  }, [commentedTo.id])

  const createComment = () => {
    fetch(`${BACKEND}/api/file/comment/create`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        body: values.body,
        commentedTo: commentedTo.id
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) throw Error(data.error?.message || 'Error')
      })
      .catch(err => toast.error(err.message))
  }

  return (
    <Fragment>
      <SectionHeader title={Strings.comments[lang]} />

      {user && (
        <form className="form_inner comments_form" onSubmit={onSubmit}>
          <FormCardItem>
            <div className={errors.body ? 'form_block error' : 'form_block' }>
              <Input
                name="body"
                value={values.body}
                maxLength="300"
                onChange={onChange}
                placeholder={Strings.enterYourComment[lang]}
              />
            </div>
          </FormCardItem>
        </form>
      )}

      {!loading ? (
        comments.length ? (
          comments.map(item => (
            <CommentItem key={item._id} data={item} setCommentedTo={setCommentedTo} />
          ))
        ) : <Errorer message={Strings.noCommentsYet[lang]} />
      ) : (
        <Loader className="more_loader" color="#64707d" />
      )}
    </Fragment>
  )
}

export default Comments;
