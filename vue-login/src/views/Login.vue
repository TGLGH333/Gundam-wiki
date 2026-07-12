<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabaseAuth, SUPABASE_URL, PUBLISHABLE_KEY } from '../supabase'

const route = useRoute()
const router = useRouter()

const portal = ref<'user' | 'admin'>('user')
const registering = ref(false)
const email = ref('')
const password = ref('')
const username = ref('')
const submitting = ref(false)
const notice = ref('')
const noticeType = ref<'info' | 'error' | 'success'>('info')
const usernameAvailable = ref<boolean | null>(null)
const checkingUsername = ref(false)

const redirect = computed(() => {
  const r = route.query.redirect as string
  return r || '/'
})

const isEmailValid = computed(() => email.value.includes('@'))
const isPasswordValid = computed(() => password.value.length >= 6)
const isUsernameValid = computed(() => /^[\p{L}\p{N}_]{2,24}$/u.test(username.value.trim()))

const canSubmit = computed(() => {
  if (!isEmailValid.value || !isPasswordValid.value) return false
  if (registering.value && usernameAvailable.value !== true) return false
  return true
})

const usernameHint = computed(() => {
  if (checkingUsername.value) return '正在检查用户名…'
  if (usernameAvailable.value === true) return '用户名可以使用'
  if (usernameAvailable.value === false) return '用户名已被占用'
  return '2–24 位文字、数字或下划线'
})

const usernameHintClass = computed(() => {
  if (usernameAvailable.value === true) return 'text-green-600'
  if (usernameAvailable.value === false) return 'text-red-500'
  return 'text-slate-400'
})

let usernameTimer: ReturnType<typeof setTimeout> | null = null

watch(username, () => {
  if (!registering.value || !isUsernameValid.value) {
    usernameAvailable.value = null
    if (usernameTimer) clearTimeout(usernameTimer)
    return
  }
  checkingUsername.value = true
  if (usernameTimer) clearTimeout(usernameTimer)
  usernameTimer = setTimeout(async () => {
    const result = await supabaseAuth.checkUsernameAvailable(username.value.trim())
    usernameAvailable.value = result.data === true
    checkingUsername.value = false
  }, 350)
})

function switchPortal(p: 'user' | 'admin') {
  portal.value = p
  registering.value = false
  notice.value = ''
}

function toggleRegister() {
  registering.value = !registering.value
  notice.value = ''
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  notice.value = ''

  try {
    if (registering.value) {
      const result = await supabaseAuth.signUp(email.value.trim(), password.value, username.value.trim())
      if (result.error) {
        notice.value = result.error.message
        noticeType.value = 'error'
      } else {
        notice.value = '注册成功，请前往邮箱完成验证后登录。'
        noticeType.value = 'success'
        registering.value = false
      }
    } else {
      const result = await supabaseAuth.signIn(email.value.trim(), password.value)
      if (result.error) {
        notice.value = result.error.message
        noticeType.value = 'error'
      } else {
        const user = result.data.user
        if (portal.value === 'admin') {
          const profileRes = await fetchProfile(user.id)
          if (profileRes?.role !== 'admin') {
            await supabaseAuth.signOut()
            notice.value = '该账号没有管理员权限，请使用普通用户入口登录。'
            noticeType.value = 'error'
            submitting.value = false
            return
          }
          if (profileRes.account_status === 'suspended') {
            await supabaseAuth.signOut()
            notice.value = '该账号已被管理员停用，请联系管理员。'
            noticeType.value = 'error'
            submitting.value = false
            return
          }
        }
        notice.value = portal.value === 'admin' ? '管理员登录成功，正在跳转…' : '登录成功，正在跳转…'
        noticeType.value = 'success'
        setTimeout(() => {
          // 同源（通过 Next.js rewrites 代理），localStorage 共享，直接跳转相对路径即可
          const target = redirect.value && redirect.value !== '/' && redirect.value !== '/login'
            ? redirect.value
            : '/'
          window.location.href = target
        }, 600)
      }
    }
  } catch (e: any) {
    notice.value = e?.message || '网络错误，请稍后重试。'
    noticeType.value = 'error'
  }

  submitting.value = false
}

async function fetchProfile(userId: string) {
  const token = localStorage.getItem('gundam_supabase_token')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`, {
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: `Bearer ${token || PUBLISHABLE_KEY}`,
      Prefer: 'return=representation',
    },
  })
  const data = await res.json()
  return Array.isArray(data) && data.length > 0 ? data[0] : null
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <section class="w-full max-w-5xl grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <div class="rounded-[2rem] border border-white/20 bg-white p-8 shadow-xl">
        <div class="font-mono text-xs tracking-[.3em] text-blue-600">IDENTITY ACCESS / 01</div>
        <h1 class="mt-6 text-5xl font-black leading-none">进入<br />高达模型档案库</h1>
        <p class="mt-6 text-slate-500">普通用户可以参与条目编辑、发布作品与社区讨论；管理员账号拥有审核与后台管理权限。</p>
        <div class="mt-10 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-2xl bg-slate-50 p-4">
            <b>普通用户</b>
            <p class="mt-2 text-xs text-slate-500">邮箱注册 · 内容贡献 · 作品发布</p>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <b>管理员</b>
            <p class="mt-2 text-xs text-slate-500">内容审核 · 条目管理 · 社区治理</p>
          </div>
        </div>
      </div>

      <div class="rounded-[2rem] border border-white/20 bg-white p-8 shadow-xl">
        <div class="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-2">
          <button
            @click="switchPortal('user')"
            :class="[
              'rounded-xl px-4 py-3 font-bold transition',
              portal === 'user' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'
            ]"
          >普通用户入口</button>
          <button
            @click="switchPortal('admin')"
            :class="[
              'rounded-xl px-4 py-3 font-bold transition',
              portal === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'
            ]"
          >管理员入口</button>
        </div>

        <div class="mt-8">
          <div class="text-sm font-bold text-blue-600">
            {{ portal === 'admin' ? 'ADMIN AUTHORIZATION' : registering ? 'CREATE ACCOUNT' : 'MEMBER LOGIN' }}
          </div>
          <h2 class="mt-2 text-3xl font-black">
            {{ portal === 'admin' ? '管理员登录' : registering ? '注册普通用户' : '普通用户登录' }}
          </h2>
          <p v-if="portal === 'admin'" class="mt-3 text-sm text-slate-500">
            仅已被授予管理员角色的账号可以进入后台。
          </p>

          <div v-if="notice"
            :class="[
              'mt-5 rounded-2xl border p-4 text-sm',
              noticeType === 'error' ? 'border-red-200 bg-red-50 text-red-700' :
              noticeType === 'success' ? 'border-green-200 bg-green-50 text-green-700' :
              'border-amber-200 bg-amber-50 text-amber-700'
            ]"
          >{{ notice }}</div>

          <div class="mt-6 space-y-4">
            <div v-if="registering">
              <label class="block">
                <span class="text-sm font-bold text-slate-500">用户名</span>
                <input
                  v-model="username"
                  type="text"
                  placeholder="2–24 位文字、数字或下划线"
                  class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300"
                />
              </label>
              <div :class="['mt-2 text-xs font-bold', usernameHintClass]">
                {{ usernameHint }}
              </div>
            </div>

            <label class="block">
              <span class="text-sm font-bold text-slate-500">邮箱地址</span>
              <input
                v-model="email"
                type="email"
                placeholder="your@email.com"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300"
              />
            </label>

            <label class="block">
              <span class="text-sm font-bold text-slate-500">密码</span>
              <input
                v-model="password"
                type="password"
                placeholder="至少 6 位"
                class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-300"
              />
            </label>

            <button
              @click="submit"
              :disabled="!canSubmit || submitting"
              class="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white transition disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {{ submitting ? '处理中…' : portal === 'admin' ? '验证管理员身份' : registering ? '创建账号' : '登录' }}
            </button>
          </div>

          <button
            v-if="portal === 'user'"
            @click="toggleRegister"
            class="mt-5 text-sm font-bold text-blue-600 hover:underline"
          >
            {{ registering ? '已有账号？返回登录' : '没有账号？使用邮箱注册' }}
          </button>

          <button
            @click="router.back()"
            class="mt-6 w-full text-sm text-slate-400 hover:text-slate-600"
          >
            ← 返回
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
