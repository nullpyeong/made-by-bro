// @ts-nocheck
/* ===== EPIC 학습 엔진 — docs/pages/app.js 의 진도 모델 + 13강 데이터 + player/course 엔진을
   verbatim 포팅. 데이터 전사 오류 방지를 위해 원본 그대로 옮기고 SPA 경로만 치환했다.
   Player/Mypage/Course가 공유한다. ===== */
import { toast } from './interactions'

/* ----- 헬퍼 ----- */
const _ORD=['①','②','③','④','⑤'];
function escapeAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

/* ----- 커리큘럼 + nextLesson ----- */
const CURRICULUM=[
  {sec:'섹션 1. 워밍업 — 인사하고 나 소개하기', lessons:['1-1','1-2','1-3']},
  {sec:'섹션 2. 학교 생활 영어',               lessons:['2-1','2-2','2-3','2-4']},
  {sec:'섹션 3. 내 하루 이야기하기',           lessons:['3-1','3-2','3-3']},
  {sec:'섹션 4. 가족 나들이·여행 영어',        lessons:['4-1','4-2','4-3']}
];
const ALL_LESSONS=CURRICULUM.reduce((a,s)=>a.concat(s.lessons),[]); // 13개
const LESSON_MIN=13; // 레슨 1개 학습 시간(분, 데모)
// 다음 학습할 강의(완료 안 된 첫 강) — 대시보드/이어보기에서 사용
function nextLesson(){
  const p=getProgress();
  for(const id of ALL_LESSONS){ if(!p.done[id]) return {id, title:(LESSONS[id]?LESSONS[id].title:id)}; }
  const last=ALL_LESSONS[ALL_LESSONS.length-1];
  return {id:last, title:(LESSONS[last]?LESSONS[last].title:last), allDone:true};
}

/* ----- 13강 레슨 데이터 + 인덱스 ----- */
const LESSON_LIST=[
  {"id":"1-1","sec":0,"title":"1-1. 오리엔테이션 — 영어로 말문 트기","free":true,"duration":"06:12","watchPct":0,
   "intro":"이번 시간에는 영어로 처음 말문을 트는 가장 기본적인 인사를 배워요. <b style=\"color:var(--color-primary)\">Hello / How are you?</b> 로 인사하고 기분을 묻고 답하는 연습을 해 봐요!",
   "expr":[
     {"en":"Hello!","ko":"안녕하세요!","ex":"<b>A:</b> Hello! <b>B:</b> Hello! (안녕!)"},
     {"en":"How are you?","ko":"잘 지내요? / 기분이 어때요?","ex":"<b>A:</b> How are you? <b>B:</b> I'm good. (잘 지내요.)"},
     {"en":"I'm good, thank you.","ko":"잘 지내요, 고마워요.","ex":"<b>A:</b> How are you? <b>B:</b> I'm good, thank you. (잘 지내요, 고마워요.)"},
     {"en":"And you?","ko":"당신은요? / 너는?","ex":"<b>A:</b> I'm good. And you? <b>B:</b> I'm good, too. (나도 좋아.)"},
     {"en":"Goodbye! See you tomorrow.","ko":"안녕히 가세요! 내일 봐요.","ex":"<b>A:</b> Goodbye! See you tomorrow. <b>B:</b> Bye! (잘 가!)"}
   ],
   "vocab":[
     {"w":"hello","pos":"int.","mean":"안녕(하세요)","ex":"<b>Hello, everyone!</b> 모두 안녕하세요!"},
     {"w":"how","pos":"adv.","mean":"어떻게, 어떤","ex":"<b>How are you?</b> 잘 지내요?"},
     {"w":"good","pos":"adj.","mean":"좋은, 잘 지내는","ex":"<b>I'm good.</b> 저는 잘 지내요."},
     {"w":"fine","pos":"adj.","mean":"괜찮은, 좋은","ex":"<b>I'm fine.</b> 저는 괜찮아요."},
     {"w":"thank","pos":"v.","mean":"고마워하다, 감사하다","ex":"<b>Thank you.</b> 고마워요."},
     {"w":"goodbye","pos":"int.","mean":"안녕히 가세요, 잘 가","ex":"<b>Goodbye!</b> 잘 가!"}
   ],
   "quiz":[
     {"q":"\"잘 지내요?\"라고 안부를 물을 때 알맞은 표현은?","opts":["Goodbye!","How are you?","Thank you."],"a":1},
     {"q":"\"How are you?\"에 대한 자연스러운 대답은?","opts":["I'm good, thank you.","See you tomorrow.","Hello!"],"a":0},
     {"q":"상대가 안부를 물은 뒤 \"너는?\"이라고 되물을 때 쓰는 말은?","opts":["And you?","Goodbye!","I'm good."],"a":0},
     {"q":"헤어질 때 하는 인사로 알맞은 것은?","opts":["Hello!","How are you?","Goodbye! See you tomorrow."],"a":2}
   ],
   "dict":[
     {"en":"Hello! How are you?","ko":"안녕하세요! 잘 지내요?"},
     {"en":"I'm good, thank you.","ko":"잘 지내요, 고마워요."},
     {"en":"Goodbye! See you tomorrow.","ko":"안녕히 가세요! 내일 봐요."}
   ],
   "hw":{"prompt":"오늘 배운 인사 표현으로 친구나 가족에게 안부를 묻고 답하는 짧은 대화를 영어로 써 보세요.","placeholder":"A: Hello! How are you?\nB: I'm good, thank you. And you?\nA: I'm good, too. Goodbye!","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:20","en":"Hello, everyone. Welcome to our English class!","ko":"여러분 안녕하세요. 우리 영어 수업에 온 걸 환영해요!"},
     {"ts":"01:35","en":"Let's start with a simple greeting: Hello!","ko":"간단한 인사부터 시작해 볼게요: Hello!"},
     {"ts":"02:50","en":"When you meet someone, you can say, How are you?","ko":"누군가를 만나면 이렇게 말할 수 있어요, How are you?"},
     {"ts":"04:10","en":"You can answer, I'm good, thank you. And you?","ko":"이렇게 대답할 수 있어요, 잘 지내요, 고마워요. 너는?"},
     {"ts":"05:40","en":"Great job! Goodbye, and see you tomorrow!","ko":"아주 잘했어요! 안녕, 내일 봐요!"}
   ]},
  {"id":"1-2","sec":0,"title":"1-2. 친구에게 인사하는 말 10가지","duration":"11:30","watchPct":0,
   "intro":"이번 시간에는 친구끼리 편하게 주고받는 가벼운 인사를 배워요. <b style=\"color:var(--color-primary)\">Hi! / What's up? / See you!</b> 같은 표현으로 친구와 자연스럽게 인사해 봐요!",
   "expr":[
     {"en":"Hi! What's up?","ko":"안녕! 뭐 해? / 무슨 일이야?","ex":"<b>A:</b> Hi! What's up? <b>B:</b> Not much. (별일 없어.)"},
     {"en":"Long time no see!","ko":"오랜만이야!","ex":"<b>A:</b> Long time no see! <b>B:</b> Yeah, I missed you! (응, 보고 싶었어!)"},
     {"en":"How's it going?","ko":"어떻게 지내? / 잘 지내?","ex":"<b>A:</b> How's it going? <b>B:</b> Pretty good! (꽤 좋아!)"},
     {"en":"See you later!","ko":"나중에 봐!","ex":"<b>A:</b> See you later! <b>B:</b> See you! (또 봐!)"},
     {"en":"Take care!","ko":"잘 지내! / 몸조심해!","ex":"<b>A:</b> Take care! <b>B:</b> You too! (너도!)"}
   ],
   "vocab":[
     {"w":"hi","pos":"int.","mean":"안녕 (친근한 인사)","ex":"<b>Hi, Mina!</b> 안녕, 미나!"},
     {"w":"up","pos":"adv.","mean":"위로 (What's up?에서 '무슨 일')","ex":"<b>What's up?</b> 뭐 해?"},
     {"w":"long","pos":"adj.","mean":"긴, 오랜","ex":"<b>Long time no see!</b> 오랜만이야!"},
     {"w":"see","pos":"v.","mean":"보다, 만나다","ex":"<b>See you later!</b> 나중에 봐!"},
     {"w":"later","pos":"adv.","mean":"나중에","ex":"<b>See you later!</b> 나중에 봐!"},
     {"w":"care","pos":"n./v.","mean":"돌봄, 조심","ex":"<b>Take care!</b> 잘 지내!"}
   ],
   "quiz":[
     {"q":"친구를 만나 \"뭐 해? / 무슨 일이야?\"라고 가볍게 물을 때 쓰는 말은?","opts":["What's up?","Goodbye!","Thank you."],"a":0},
     {"q":"오랜만에 만난 친구에게 \"오랜만이야!\"라고 할 때 알맞은 표현은?","opts":["See you later!","Long time no see!","I'm good."],"a":1},
     {"q":"헤어지면서 친구에게 \"나중에 봐!\"라고 하는 말은?","opts":["See you later!","How's it going?","Hi!"],"a":0},
     {"q":"\"Take care!\"라는 인사에 자연스럽게 받아치는 대답은?","opts":["You too!","Long time no see!","What's up?"],"a":0}
   ],
   "dict":[
     {"en":"Hi! What's up?","ko":"안녕! 뭐 해?"},
     {"en":"Long time no see!","ko":"오랜만이야!"},
     {"en":"See you later! Take care!","ko":"나중에 봐! 잘 지내!"}
   ],
   "hw":{"prompt":"오늘 배운 친구끼리 쓰는 인사 표현을 활용해 친구와 만나고 헤어지는 짧은 대화를 영어로 써 보세요.","placeholder":"A: Hi! Long time no see!\nB: Yeah! How's it going?\nA: Pretty good! See you later, take care!","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:25","en":"Hi, friends! Today we learn how to greet your friends.","ko":"안녕, 친구들! 오늘은 친구에게 인사하는 법을 배워요."},
     {"ts":"02:40","en":"With friends, you can say, Hi! What's up?","ko":"친구에게는 이렇게 말할 수 있어요, 안녕! 뭐 해?"},
     {"ts":"05:15","en":"If you haven't met for a while, say, Long time no see!","ko":"오랫동안 못 만났다면 이렇게 말해요, 오랜만이야!"},
     {"ts":"08:30","en":"To say bye, you can say, See you later!","ko":"작별 인사로는 이렇게 말할 수 있어요, 나중에 봐!"},
     {"ts":"10:50","en":"And don't forget, Take care! See you next time!","ko":"그리고 잊지 마세요, 잘 지내! 다음에 봐요!"}
   ]},
  {"id":"1-3","sec":0,"title":"1-3. 나와 우리 가족 소개하기","duration":"14:08","watchPct":0,
   "intro":"이번 시간에는 나 자신과 우리 가족을 영어로 소개해 봐요. <b style=\"color:var(--color-primary)\">My name is~ / This is my~ / I have a~</b> 패턴으로 자기소개와 가족 소개를 할 수 있어요!",
   "expr":[
     {"en":"My name is Jiho.","ko":"내 이름은 지호예요.","ex":"<b>A:</b> What's your name? <b>B:</b> My name is Jiho. (제 이름은 지호예요.)"},
     {"en":"I'm twelve years old.","ko":"저는 열두 살이에요.","ex":"<b>A:</b> How old are you? <b>B:</b> I'm twelve years old. (열두 살이에요.)"},
     {"en":"This is my mom.","ko":"이분은 우리 엄마예요.","ex":"<b>A:</b> Who is this? <b>B:</b> This is my mom. (이분은 우리 엄마예요.)"},
     {"en":"I have a little brother.","ko":"저는 남동생이 한 명 있어요.","ex":"<b>A:</b> Do you have a brother? <b>B:</b> Yes, I have a little brother. (네, 남동생이 한 명 있어요.)"},
     {"en":"There are four people in my family.","ko":"우리 가족은 네 명이에요.","ex":"<b>A:</b> How big is your family? <b>B:</b> There are four people in my family. (우리 가족은 네 명이에요.)"}
   ],
   "vocab":[
     {"w":"name","pos":"n.","mean":"이름","ex":"<b>My name is Jiho.</b> 내 이름은 지호예요."},
     {"w":"old","pos":"adj.","mean":"나이가 ~인, 늙은","ex":"<b>I'm twelve years old.</b> 저는 열두 살이에요."},
     {"w":"family","pos":"n.","mean":"가족","ex":"<b>I love my family.</b> 저는 우리 가족을 사랑해요."},
     {"w":"mom","pos":"n.","mean":"엄마","ex":"<b>This is my mom.</b> 이분은 우리 엄마예요."},
     {"w":"brother","pos":"n.","mean":"형, 오빠, 남동생","ex":"<b>I have a brother.</b> 저는 형제가 있어요."},
     {"w":"have","pos":"v.","mean":"가지다, 있다","ex":"<b>I have a sister.</b> 저는 여동생이 있어요."}
   ],
   "quiz":[
     {"q":"\"내 이름은 지호예요.\"를 영어로 알맞게 표현한 것은?","opts":["My name is Jiho.","I'm twelve years old.","This is my mom."],"a":0},
     {"q":"\"How old are you?\"라는 질문에 알맞은 대답은?","opts":["My name is Jiho.","I'm twelve years old.","See you later!"],"a":1},
     {"q":"옆에 있는 가족을 가리키며 \"이분은 우리 엄마예요.\"라고 소개하는 말은?","opts":["This is my mom.","I have a brother.","How are you?"],"a":0},
     {"q":"\"저는 남동생이 한 명 있어요.\"를 영어로 알맞게 표현한 것은?","opts":["There are four people in my family.","I have a little brother.","My name is Jiho."],"a":1}
   ],
   "dict":[
     {"en":"My name is Jiho.","ko":"내 이름은 지호예요."},
     {"en":"I'm twelve years old.","ko":"저는 열두 살이에요."},
     {"en":"This is my mom. I have a little brother.","ko":"이분은 우리 엄마예요. 저는 남동생이 한 명 있어요."}
   ],
   "hw":{"prompt":"오늘 배운 표현으로 나 자신과 우리 가족을 소개하는 짧은 글을 영어로 써 보세요.","placeholder":"My name is Jiho. I'm twelve years old.\nThere are four people in my family.\nThis is my mom. I have a little brother.","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:30","en":"Hello! Today let's learn how to introduce yourself.","ko":"안녕하세요! 오늘은 자기소개하는 법을 배워 봐요."},
     {"ts":"03:20","en":"You can start with, My name is Jiho.","ko":"이렇게 시작할 수 있어요, 제 이름은 지호예요."},
     {"ts":"06:45","en":"Then tell your age: I'm twelve years old.","ko":"그다음 나이를 말해요: 저는 열두 살이에요."},
     {"ts":"10:10","en":"Now introduce your family: This is my mom.","ko":"이제 가족을 소개해요: 이분은 우리 엄마예요."},
     {"ts":"13:30","en":"You can also say, I have a little brother. Great job!","ko":"이렇게도 말할 수 있어요, 저는 남동생이 한 명 있어요. 아주 잘했어요!"}
   ]},
  {"id":"2-1","sec":1,"title":"2-1. 교실에서 선생님께 질문하기","duration":"12:40","watchPct":62,
   "intro":"수업 중 선생님께 <b style=\"color:var(--color-text)\">정중하게 질문·부탁</b>하는 법을 배워요. 핵심은 <b style=\"color:var(--color-primary)\">Can I ~? / Could you ~?</b> 패턴이에요.",
   "expr":[
     {"en":"Can I ask a question?","ko":"질문해도 될까요?","ex":"<b>A:</b> Can I ask a question? &nbsp;<b>B:</b> Of course, go ahead. (물론이죠, 말해보세요.)"},
     {"en":"Could you say that again, please?","ko":"다시 한 번 말씀해 주실 수 있어요?","ex":"못 들었을 때 정중하게 다시 부탁하는 표현. <b>please</b>를 붙이면 더 공손해요."},
     {"en":"I don't understand.","ko":"이해가 잘 안 돼요.","ex":"이어서 <b>Can you explain it again?</b> (다시 설명해 주실 수 있어요?)로 부탁할 수 있어요."},
     {"en":"What does this word mean?","ko":"이 단어는 무슨 뜻이에요?","ex":"모르는 단어가 나왔을 때. <b>How do you spell it?</b> (철자가 어떻게 돼요?)와 함께 자주 써요."},
     {"en":"May I go to the restroom?","ko":"화장실에 다녀와도 될까요?","ex":"<b>May I ~?</b>는 <b>Can I ~?</b>보다 더 정중한 허락 요청이에요."}
   ],
   "vocab":[
     {"w":"question","pos":"n.","mean":"질문","ex":"<b>Do you have a question?</b> 질문 있나요?"},
     {"w":"ask","pos":"v.","mean":"묻다, 부탁하다","ex":"<b>Can I ask you something?</b> 뭐 좀 물어봐도 돼요?"},
     {"w":"understand","pos":"v.","mean":"이해하다","ex":"<b>I understand now.</b> 이제 이해했어요."},
     {"w":"explain","pos":"v.","mean":"설명하다","ex":"<b>Can you explain it again?</b> 다시 설명해 줄래요?"},
     {"w":"repeat","pos":"v.","mean":"반복하다","ex":"<b>Please repeat that.</b> 그거 다시 말해 주세요."},
     {"w":"spell","pos":"v.","mean":"철자를 말하다","ex":"<b>How do you spell \"school\"?</b> school 철자가 어떻게 돼요?"},
     {"w":"mean","pos":"v.","mean":"의미하다","ex":"<b>What does this mean?</b> 이게 무슨 뜻이에요?"},
     {"w":"raise","pos":"v.","mean":"(손을) 들다","ex":"<b>Raise your hand.</b> 손을 드세요."}
   ],
   "quiz":[
     {"q":"\"질문해도 될까요?\"를 영어로 알맞게 표현한 것은?","opts":["Can I ask a question?","I am a question.","Question me, please."],"a":0},
     {"q":"선생님 말을 못 들었을 때 정중하게 \"다시 말씀해 주세요\"는?","opts":["Say again you.","Could you say that again, please?","Repeat you now."],"a":1},
     {"q":"빈칸: \"What does this word ____?\" (이 단어 무슨 뜻이에요?)","opts":["spell","ask","mean"],"a":2},
     {"q":"\"Raise your hand.\"의 뜻은?","opts":["손을 드세요.","자리에 앉으세요.","조용히 하세요."],"a":0}
   ],
   "dict":[
     {"en":"Can I ask a question?","ko":"질문해도 될까요?"},
     {"en":"Could you say that again, please?","ko":"다시 한 번 말씀해 주실 수 있어요?"},
     {"en":"What does this word mean?","ko":"이 단어는 무슨 뜻이에요?"}
   ],
   "hw":{"prompt":"오늘 배운 표현으로 선생님께 할 질문 3개를 영어로 써보세요.","placeholder":"Can I ask a question?\nCould you explain number 3 again?\nWhat does 'spell' mean?","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 8개를 외웠어요"]},
   "transcript":[
     {"ts":"11:52","en":"Does anyone have a question?","ko":"질문 있는 사람 있나요?"},
     {"ts":"12:05","en":"Yes, can I ask a question?","ko":"네, 질문해도 될까요?"},
     {"ts":"12:18","en":"Of course. Go ahead.","ko":"물론이죠. 말해보세요."},
     {"ts":"12:30","en":"I don't understand. Could you say that again, please?","ko":"이해가 안 돼요. 다시 한 번 말씀해 주실 수 있어요?"},
     {"ts":"12:44","en":"Sure. Let me explain it again.","ko":"그럼요. 다시 설명해 줄게요."}
   ]},
  {"id":"2-2","sec":1,"title":"2-2. 좋아하는 과목·취미 말하기","duration":"15:22","watchPct":0,
   "intro":"이번 강에서는 내가 좋아하는 과목과 취미를 영어로 말하는 법을 배워요. <b style=\"color:var(--color-primary)\">My favorite subject is ~</b> 와 <b style=\"color:var(--color-primary)\">I like ~ing</b> 패턴을 익혀 친구에게 내 관심사를 소개해 봐요.",
   "expr":[
     {"en":"My favorite subject is science.","ko":"내가 제일 좋아하는 과목은 과학이야.","ex":"<b>A:</b> What's your favorite subject? <b>B:</b> My favorite subject is science. (내가 제일 좋아하는 과목은 과학이야.)"},
     {"en":"I like drawing.","ko":"나는 그림 그리는 걸 좋아해.","ex":"<b>A:</b> What do you like to do? <b>B:</b> I like drawing. (나는 그림 그리는 걸 좋아해.)"},
     {"en":"What do you do for fun?","ko":"취미로 뭐 해?","ex":"<b>A:</b> What do you do for fun? <b>B:</b> I read comic books. (나는 만화책을 읽어.)"},
     {"en":"My hobby is playing soccer.","ko":"내 취미는 축구하는 거야.","ex":"<b>A:</b> What's your hobby? <b>B:</b> My hobby is playing soccer. (내 취미는 축구하는 거야.)"},
     {"en":"I'm good at math.","ko":"나는 수학을 잘해.","ex":"<b>A:</b> Are you good at math? <b>B:</b> Yes, I'm good at math. (응, 나는 수학을 잘해.)"}
   ],
   "vocab":[
     {"w":"subject","pos":"n.","mean":"과목","ex":"<b>What subject do you like?</b> 어떤 과목을 좋아해?"},
     {"w":"favorite","pos":"adj.","mean":"가장 좋아하는","ex":"<b>This is my favorite book.</b> 이건 내가 제일 좋아하는 책이야."},
     {"w":"hobby","pos":"n.","mean":"취미","ex":"<b>My hobby is reading.</b> 내 취미는 독서야."},
     {"w":"science","pos":"n.","mean":"과학","ex":"<b>I have science class today.</b> 오늘 과학 수업이 있어."},
     {"w":"draw","pos":"v.","mean":"그림을 그리다","ex":"<b>I like to draw animals.</b> 나는 동물 그리는 걸 좋아해."},
     {"w":"fun","pos":"n.","mean":"재미, 즐거움","ex":"<b>We had a lot of fun.</b> 우리는 정말 즐거웠어."}
   ],
   "quiz":[
     {"q":"\"내가 제일 좋아하는 과목은 과학이야.\"를 알맞게 표현한 것은?","opts":["I like science subject me.","My favorite subject is science.","Science likes me."],"a":1},
     {"q":"\"취미로 뭐 해?\"라고 물을 때 알맞은 표현은?","opts":["What do you do for fun?","How are you fun?","Do you fun?"],"a":0},
     {"q":"\"나는 그림 그리는 걸 좋아해.\"를 영어로 바르게 쓴 것은?","opts":["I like draw.","I am drawing like.","I like drawing."],"a":2},
     {"q":"빈칸에 알맞은 말은? \"My hobby ___ playing soccer.\"","opts":["is","are","do"],"a":0}
   ],
   "dict":[
     {"en":"My favorite subject is science.","ko":"내가 제일 좋아하는 과목은 과학이야."},
     {"en":"I like drawing.","ko":"나는 그림 그리는 걸 좋아해."},
     {"en":"What do you do for fun?","ko":"취미로 뭐 해?"}
   ],
   "hw":{"prompt":"오늘 배운 표현을 활용해서 내가 좋아하는 과목과 취미를 영어로 3문장 써 보세요.","placeholder":"My favorite subject is English.\nI like singing.\nMy hobby is playing the piano.","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:30","en":"What's your favorite subject?","ko":"좋아하는 과목이 뭐야?"},
     {"ts":"02:15","en":"My favorite subject is science.","ko":"내가 제일 좋아하는 과목은 과학이야."},
     {"ts":"05:40","en":"What do you do for fun?","ko":"취미로 뭐 해?"},
     {"ts":"08:50","en":"I like drawing and reading comic books.","ko":"나는 그림 그리고 만화책 읽는 걸 좋아해."},
     {"ts":"12:20","en":"Cool! My hobby is playing soccer.","ko":"멋지다! 내 취미는 축구하는 거야."}
   ]},
  {"id":"2-3","sec":1,"title":"2-3. 친구랑 놀자고 말하기","duration":"13:05","watchPct":0,
   "intro":"이번 강에서는 친구에게 같이 놀자고 제안하는 법을 배워요. <b style=\"color:var(--color-primary)\">Let's ~</b> 와 <b style=\"color:var(--color-primary)\">Do you want to ~?</b> 패턴으로 친구를 초대하고, 대답하는 말까지 익혀 봐요.",
   "expr":[
     {"en":"Let's play together.","ko":"우리 같이 놀자.","ex":"<b>A:</b> Let's play together. <b>B:</b> Sure! (좋아!)"},
     {"en":"Do you want to play soccer?","ko":"축구할래?","ex":"<b>A:</b> Do you want to play soccer? <b>B:</b> Yes, I do! (응, 좋아!)"},
     {"en":"Sounds good!","ko":"좋아! (좋은 생각이야!)","ex":"<b>A:</b> Let's go to the park. <b>B:</b> Sounds good! (좋아!)"},
     {"en":"Maybe next time.","ko":"다음에 하자.","ex":"<b>A:</b> Do you want to come over? <b>B:</b> Maybe next time. (다음에 하자.)"},
     {"en":"Can you come out and play?","ko":"나와서 같이 놀 수 있어?","ex":"<b>A:</b> Can you come out and play? <b>B:</b> Yes, let me ask my mom. (응, 엄마한테 물어볼게.)"}
   ],
   "vocab":[
     {"w":"play","pos":"v.","mean":"놀다, (운동을) 하다","ex":"<b>Let's play after school.</b> 학교 끝나고 놀자."},
     {"w":"together","pos":"adv.","mean":"함께, 같이","ex":"<b>We study together.</b> 우리는 같이 공부해."},
     {"w":"want","pos":"v.","mean":"원하다, ~하고 싶다","ex":"<b>I want to play outside.</b> 나는 밖에서 놀고 싶어."},
     {"w":"park","pos":"n.","mean":"공원","ex":"<b>Let's go to the park.</b> 공원에 가자."},
     {"w":"maybe","pos":"adv.","mean":"아마, 어쩌면","ex":"<b>Maybe we can play tomorrow.</b> 어쩌면 내일 놀 수 있어."},
     {"w":"sure","pos":"adv.","mean":"그럼, 좋아","ex":"<b>Sure, let's go!</b> 그래, 가자!"}
   ],
   "quiz":[
     {"q":"\"우리 같이 놀자.\"를 알맞게 표현한 것은?","opts":["Let's play together.","We play yesterday.","Play me you."],"a":0},
     {"q":"\"축구할래?\"라고 제안할 때 알맞은 표현은?","opts":["You play soccer now.","Do you want to play soccer?","Soccer do you?"],"a":1},
     {"q":"친구의 제안을 정중히 거절하는 표현은?","opts":["Sounds good!","Yes, I do!","Maybe next time."],"a":2},
     {"q":"\"좋아! (좋은 생각이야!)\"라고 신나게 동의하는 표현은?","opts":["No, thanks.","Sounds good!","I don't know."],"a":1}
   ],
   "dict":[
     {"en":"Let's play together.","ko":"우리 같이 놀자."},
     {"en":"Do you want to play soccer?","ko":"축구할래?"},
     {"en":"Maybe next time.","ko":"다음에 하자."}
   ],
   "hw":{"prompt":"오늘 배운 표현으로 친구에게 같이 놀자고 제안하는 짧은 대화를 영어로 써 보세요.","placeholder":"A: Let's play together.\nB: Sounds good!\nA: Do you want to play soccer?","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:25","en":"Hey, let's play together!","ko":"야, 우리 같이 놀자!"},
     {"ts":"02:40","en":"Do you want to play soccer?","ko":"축구할래?"},
     {"ts":"05:10","en":"Sounds good! Let's go to the park.","ko":"좋아! 공원에 가자."},
     {"ts":"08:30","en":"Can you come out and play?","ko":"나와서 같이 놀 수 있어?"},
     {"ts":"11:15","en":"Sorry, maybe next time.","ko":"미안, 다음에 하자."}
   ]},
  {"id":"2-4","sec":1,"title":"2-4. 급식·점심시간 표현","duration":"11:48","watchPct":0,
   "intro":"이번 강에서는 급식과 점심시간에 쓰는 영어 표현을 배워요. <b style=\"color:var(--color-primary)\">What's for lunch?</b> 와 <b style=\"color:var(--color-primary)\">Can I have ~?</b> 패턴으로 배고플 때와 음식을 더 달라고 할 때 말해 봐요.",
   "expr":[
     {"en":"I'm hungry.","ko":"나 배고파.","ex":"<b>A:</b> Are you okay? <b>B:</b> I'm hungry. (나 배고파.)"},
     {"en":"What's for lunch?","ko":"점심 메뉴가 뭐야?","ex":"<b>A:</b> What's for lunch? <b>B:</b> It's curry and rice. (카레라이스야.)"},
     {"en":"Can I have some more?","ko":"좀 더 먹어도 돼요?","ex":"<b>A:</b> Can I have some more? <b>B:</b> Sure, here you go. (그럼, 여기 있어.)"},
     {"en":"It's delicious!","ko":"정말 맛있어!","ex":"<b>A:</b> How is the soup? <b>B:</b> It's delicious! (정말 맛있어!)"},
     {"en":"Let's eat lunch.","ko":"점심 먹자.","ex":"<b>A:</b> It's lunchtime. Let's eat lunch. <b>B:</b> Okay! (좋아!)"}
   ],
   "vocab":[
     {"w":"lunch","pos":"n.","mean":"점심, 점심밥","ex":"<b>Lunch is at noon.</b> 점심은 정오에 먹어."},
     {"w":"hungry","pos":"adj.","mean":"배고픈","ex":"<b>I'm so hungry now.</b> 나 지금 너무 배고파."},
     {"w":"delicious","pos":"adj.","mean":"맛있는","ex":"<b>The pizza is delicious.</b> 이 피자는 맛있어."},
     {"w":"eat","pos":"v.","mean":"먹다","ex":"<b>Let's eat together.</b> 같이 먹자."},
     {"w":"rice","pos":"n.","mean":"밥, 쌀","ex":"<b>I eat rice every day.</b> 나는 매일 밥을 먹어."},
     {"w":"more","pos":"adj.","mean":"더, 더 많은","ex":"<b>Can I have more milk?</b> 우유 좀 더 마셔도 돼요?"}
   ],
   "quiz":[
     {"q":"\"나 배고파.\"를 알맞게 표현한 것은?","opts":["I'm hungry.","I'm angry.","I'm hurry."],"a":0},
     {"q":"\"점심 메뉴가 뭐야?\"라고 물을 때 알맞은 표현은?","opts":["What time is lunch?","What's for lunch?","Where is lunch?"],"a":1},
     {"q":"\"좀 더 먹어도 돼요?\"라고 정중히 부탁하는 표현은?","opts":["Give me food now.","I want eat more.","Can I have some more?"],"a":2},
     {"q":"\"정말 맛있어!\"라고 음식을 칭찬하는 표현은?","opts":["It's delicious!","It's terrible!","It's empty!"],"a":0}
   ],
   "dict":[
     {"en":"I'm hungry.","ko":"나 배고파."},
     {"en":"What's for lunch?","ko":"점심 메뉴가 뭐야?"},
     {"en":"Can I have some more?","ko":"좀 더 먹어도 돼요?"}
   ],
   "hw":{"prompt":"오늘 배운 표현으로 점심시간에 친구와 나누는 짧은 대화를 영어로 써 보세요.","placeholder":"A: I'm hungry. What's for lunch?\nB: It's curry and rice.\nA: Yum! It's delicious!","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:20","en":"I'm so hungry. What's for lunch?","ko":"나 너무 배고파. 점심 메뉴가 뭐야?"},
     {"ts":"02:30","en":"It's curry and rice today.","ko":"오늘은 카레라이스야."},
     {"ts":"05:00","en":"Yum! It's delicious!","ko":"냠냠! 정말 맛있어!"},
     {"ts":"07:45","en":"Can I have some more?","ko":"좀 더 먹어도 돼요?"},
     {"ts":"10:10","en":"Sure, here you go. Let's eat lunch.","ko":"그럼, 여기 있어. 점심 먹자."}
   ]},
  {"id":"3-1","sec":2,"title":"3-1. 시간·요일·날짜 말하기","duration":"12:10","watchPct":0,
   "intro":"오늘은 시간, 요일, 날짜를 영어로 말하는 법을 배워요. <b style=\"color:var(--color-primary)\">What time is it?</b>와 <b style=\"color:var(--color-primary)\">What day is it today?</b> 패턴을 익혀 봐요!",
   "expr":[
     {"en":"What time is it?","ko":"지금 몇 시야?","ex":"<b>A:</b> What time is it? <b>B:</b> It's three o'clock. (3시야.)"},
     {"en":"It's seven thirty.","ko":"7시 30분이야.","ex":"<b>A:</b> What time is it? <b>B:</b> It's seven thirty. (7시 30분이야.)"},
     {"en":"What day is it today?","ko":"오늘 무슨 요일이야?","ex":"<b>A:</b> What day is it today? <b>B:</b> It's Monday. (월요일이야.)"},
     {"en":"What's the date today?","ko":"오늘 며칠이야?","ex":"<b>A:</b> What's the date today? <b>B:</b> It's June 20th. (6월 20일이야.)"},
     {"en":"See you tomorrow!","ko":"내일 보자!","ex":"<b>A:</b> See you tomorrow! <b>B:</b> Okay, bye! (그래, 안녕!)"}
   ],
   "vocab":[
     {"w":"time","pos":"n.","mean":"시간","ex":"<b>What time is it?</b> 몇 시야?"},
     {"w":"o'clock","pos":"adv.","mean":"~시 (정각)","ex":"It's five <b>o'clock</b>. 5시 정각이야."},
     {"w":"day","pos":"n.","mean":"날, 요일","ex":"What <b>day</b> is it? 무슨 요일이야?"},
     {"w":"date","pos":"n.","mean":"날짜","ex":"What's the <b>date</b> today? 오늘 며칠이야?"},
     {"w":"today","pos":"adv.","mean":"오늘","ex":"It's sunny <b>today</b>. 오늘은 화창해."},
     {"w":"tomorrow","pos":"adv.","mean":"내일","ex":"See you <b>tomorrow</b>. 내일 보자."}
   ],
   "quiz":[
     {"q":"\"지금 몇 시야?\"를 영어로 알맞게 표현한 것은?","opts":["What day is it?","What time is it?","How old are you?"],"a":1},
     {"q":"\"It's seven thirty.\"의 뜻으로 알맞은 것은?","opts":["7시 13분이야.","7시 30분이야.","30시 7분이야."],"a":1},
     {"q":"\"오늘 무슨 요일이야?\"를 영어로 알맞게 표현한 것은?","opts":["What day is it today?","What's the date today?","What time is it?"],"a":0},
     {"q":"\"tomorrow\"의 뜻으로 알맞은 것은?","opts":["오늘","어제","내일"],"a":2}
   ],
   "dict":[
     {"en":"What time is it?","ko":"지금 몇 시야?"},
     {"en":"It's three o'clock.","ko":"3시야."},
     {"en":"What day is it today?","ko":"오늘 무슨 요일이야?"}
   ],
   "hw":{"prompt":"오늘 배운 표현으로 지금 시간과 오늘 요일을 영어로 써 보세요.","placeholder":"What time is it? It's four o'clock.\nWhat day is it today? It's Friday.\nSee you tomorrow!","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:25","en":"What time is it now?","ko":"지금 몇 시야?"},
     {"ts":"01:40","en":"It's three o'clock.","ko":"3시야."},
     {"ts":"03:15","en":"What day is it today?","ko":"오늘 무슨 요일이야?"},
     {"ts":"05:30","en":"It's Monday. And what's the date?","ko":"월요일이야. 그럼 며칠이지?"},
     {"ts":"08:10","en":"It's June 20th. See you tomorrow!","ko":"6월 20일이야. 내일 보자!"}
   ]},
  {"id":"3-2","sec":2,"title":"3-2. 내 하루 일과 말하기","duration":"14:30","watchPct":0,
   "intro":"오늘은 나의 하루 일과를 영어로 말하는 법을 배워요. <b style=\"color:var(--color-primary)\">I get up at ~</b>와 <b style=\"color:var(--color-primary)\">I go to bed at ~</b> 패턴으로 하루를 소개해 봐요!",
   "expr":[
     {"en":"I get up at seven.","ko":"나는 7시에 일어나.","ex":"<b>A:</b> When do you get up? <b>B:</b> I get up at seven. (나는 7시에 일어나.)"},
     {"en":"I go to school at eight.","ko":"나는 8시에 학교에 가.","ex":"<b>A:</b> What time do you go to school? <b>B:</b> I go to school at eight. (8시에 가.)"},
     {"en":"After school, I play soccer.","ko":"방과 후에 나는 축구를 해.","ex":"<b>A:</b> What do you do after school? <b>B:</b> After school, I play soccer. (방과 후에 축구해.)"},
     {"en":"I do my homework in the evening.","ko":"나는 저녁에 숙제를 해.","ex":"<b>A:</b> When do you do your homework? <b>B:</b> I do my homework in the evening. (저녁에 해.)"},
     {"en":"I go to bed at ten.","ko":"나는 10시에 자.","ex":"<b>A:</b> What time do you go to bed? <b>B:</b> I go to bed at ten. (10시에 자.)"}
   ],
   "vocab":[
     {"w":"get up","pos":"v.","mean":"일어나다","ex":"I <b>get up</b> at six. 나는 6시에 일어나."},
     {"w":"school","pos":"n.","mean":"학교","ex":"I go to <b>school</b> at eight. 8시에 학교에 가."},
     {"w":"after","pos":"prep.","mean":"~후에","ex":"<b>After</b> school, I play. 방과 후에 나는 놀아."},
     {"w":"homework","pos":"n.","mean":"숙제","ex":"I do my <b>homework</b>. 나는 숙제를 해."},
     {"w":"evening","pos":"n.","mean":"저녁","ex":"I read in the <b>evening</b>. 나는 저녁에 책을 읽어."},
     {"w":"go to bed","pos":"v.","mean":"자러 가다","ex":"I <b>go to bed</b> at ten. 나는 10시에 자."}
   ],
   "quiz":[
     {"q":"\"나는 7시에 일어나.\"를 영어로 알맞게 표현한 것은?","opts":["I get up at seven.","I go to bed at seven.","I go to school at seven."],"a":0},
     {"q":"\"after school\"의 뜻으로 알맞은 것은?","opts":["학교 가기 전에","방과 후에","학교에서"],"a":1},
     {"q":"\"나는 저녁에 숙제를 해.\"에서 빈칸에 알맞은 단어는? I do my ___ in the evening.","opts":["homework","school","time"],"a":0},
     {"q":"\"go to bed\"의 뜻으로 알맞은 것은?","opts":["일어나다","자러 가다","학교에 가다"],"a":1}
   ],
   "dict":[
     {"en":"I get up at seven.","ko":"나는 7시에 일어나."},
     {"en":"After school, I play soccer.","ko":"방과 후에 나는 축구를 해."},
     {"en":"I go to bed at ten.","ko":"나는 10시에 자."}
   ],
   "hw":{"prompt":"오늘 배운 표현으로 여러분의 하루 일과를 영어로 3문장 써 보세요.","placeholder":"I get up at seven.\nAfter school, I do my homework.\nI go to bed at ten.","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:30","en":"When do you get up?","ko":"너는 몇 시에 일어나?"},
     {"ts":"02:15","en":"I get up at seven every day.","ko":"나는 매일 7시에 일어나."},
     {"ts":"05:00","en":"What do you do after school?","ko":"방과 후에 너는 뭐 해?"},
     {"ts":"08:45","en":"After school, I play soccer and do my homework.","ko":"방과 후에 축구하고 숙제를 해."},
     {"ts":"12:20","en":"I go to bed at ten. Good night!","ko":"나는 10시에 자. 잘 자!"}
   ]},
  {"id":"3-3","sec":2,"title":"3-3. 문자·전화로 약속 잡기","duration":"13:55","watchPct":0,
   "intro":"오늘은 문자나 전화로 친구와 약속을 잡는 법을 배워요. <b style=\"color:var(--color-primary)\">Can you come?</b>와 <b style=\"color:var(--color-primary)\">Let's meet at ~</b> 패턴으로 약속을 정해 봐요!",
   "expr":[
     {"en":"Can you come to my house?","ko":"우리 집에 올 수 있어?","ex":"<b>A:</b> Can you come to my house? <b>B:</b> Sure, I can! (응, 갈 수 있어!)"},
     {"en":"Let's meet at the park.","ko":"공원에서 만나자.","ex":"<b>A:</b> Let's meet at the park. <b>B:</b> Okay, sounds good! (그래, 좋아!)"},
     {"en":"What about Saturday?","ko":"토요일은 어때?","ex":"<b>A:</b> What about Saturday? <b>B:</b> Saturday is perfect. (토요일 딱 좋아.)"},
     {"en":"Let's meet at two o'clock.","ko":"2시에 만나자.","ex":"<b>A:</b> Let's meet at two o'clock. <b>B:</b> Okay, see you then! (그래, 그때 보자!)"},
     {"en":"See you then!","ko":"그때 보자!","ex":"<b>A:</b> See you then! <b>B:</b> Bye! See you! (안녕, 또 봐!)"}
   ],
   "vocab":[
     {"w":"come","pos":"v.","mean":"오다","ex":"Can you <b>come</b>? 너 올 수 있어?"},
     {"w":"meet","pos":"v.","mean":"만나다","ex":"Let's <b>meet</b> at three. 3시에 만나자."},
     {"w":"park","pos":"n.","mean":"공원","ex":"Let's meet at the <b>park</b>. 공원에서 만나자."},
     {"w":"Saturday","pos":"n.","mean":"토요일","ex":"What about <b>Saturday</b>? 토요일은 어때?"},
     {"w":"call","pos":"v.","mean":"전화하다","ex":"I'll <b>call</b> you later. 이따 전화할게."},
     {"w":"then","pos":"adv.","mean":"그때","ex":"See you <b>then</b>! 그때 보자!"}
   ],
   "quiz":[
     {"q":"\"공원에서 만나자.\"를 영어로 알맞게 표현한 것은?","opts":["Let's meet at the park.","Can you come?","See you then!"],"a":0},
     {"q":"\"What about Saturday?\"의 뜻으로 알맞은 것은?","opts":["토요일은 어때?","토요일에 만나자.","토요일은 무슨 요일이야?"],"a":0},
     {"q":"\"meet\"의 뜻으로 알맞은 것은?","opts":["오다","만나다","전화하다"],"a":1},
     {"q":"친구와 약속 시간을 정한 뒤 \"그때 보자!\"라고 말할 때 알맞은 표현은?","opts":["See you then!","What about Saturday?","Can you come?"],"a":0}
   ],
   "dict":[
     {"en":"Can you come to my house?","ko":"우리 집에 올 수 있어?"},
     {"en":"Let's meet at the park.","ko":"공원에서 만나자."},
     {"en":"See you then!","ko":"그때 보자!"}
   ],
   "hw":{"prompt":"오늘 배운 표현으로 친구에게 약속을 잡는 문자 메시지를 영어로 써 보세요.","placeholder":"Hi! Can you come to the park?\nLet's meet at two o'clock on Saturday.\nSee you then!","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:20","en":"Hi! Can you come to my house on Saturday?","ko":"안녕! 토요일에 우리 집에 올 수 있어?"},
     {"ts":"02:50","en":"Sure! What time should we meet?","ko":"물론이지! 몇 시에 만날까?"},
     {"ts":"06:10","en":"Let's meet at two o'clock.","ko":"2시에 만나자."},
     {"ts":"09:30","en":"Okay! What about going to the park, too?","ko":"좋아! 공원에도 가는 건 어때?"},
     {"ts":"12:40","en":"Great idea. See you then!","ko":"좋은 생각이야. 그때 보자!"}
   ]},
  {"id":"4-1","sec":3,"title":"4-1. 가족 여행 — 공항에서","duration":"16:20","watchPct":0,
   "intro":"가족과 함께 공항에 도착했어요! 이번 강에서는 공항에서 꼭 필요한 영어를 배워요. 길을 찾을 때 쓰는 <b style=\"color:var(--color-primary)\">Where is ~?</b> 패턴을 익혀 봐요.",
   "expr":[
     {"en":"Where is the gate?","ko":"탑승구가 어디예요?","ex":"<b>A:</b> Where is the gate? (탑승구가 어디예요?) <b>B:</b> It's over there. (저쪽이에요.)"},
     {"en":"Here is my boarding pass.","ko":"여기 제 탑승권이에요.","ex":"<b>A:</b> Your boarding pass, please. (탑승권 주세요.) <b>B:</b> Here is my boarding pass. (여기 제 탑승권이에요.)"},
     {"en":"Where is the restroom?","ko":"화장실이 어디예요?","ex":"<b>A:</b> Where is the restroom? (화장실이 어디예요?) <b>B:</b> Next to the cafe. (카페 옆이에요.)"},
     {"en":"This is my family.","ko":"이쪽은 제 가족이에요.","ex":"<b>A:</b> This is my family. (이쪽은 제 가족이에요.) <b>B:</b> Nice to meet you! (만나서 반가워요!)"},
     {"en":"We are going to Jeju.","ko":"우리는 제주에 가요.","ex":"<b>A:</b> Where are you going? (어디 가세요?) <b>B:</b> We are going to Jeju. (우리는 제주에 가요.)"}
   ],
   "vocab":[
     {"w":"airport","pos":"n.","mean":"공항","ex":"<b>We are at the airport.</b> 우리는 공항에 있어요."},
     {"w":"gate","pos":"n.","mean":"탑승구","ex":"<b>Our gate is number five.</b> 우리 탑승구는 5번이에요."},
     {"w":"boarding pass","pos":"n.","mean":"탑승권","ex":"<b>Please show your boarding pass.</b> 탑승권을 보여 주세요."},
     {"w":"restroom","pos":"n.","mean":"화장실","ex":"<b>The restroom is over there.</b> 화장실은 저쪽이에요."},
     {"w":"family","pos":"n.","mean":"가족","ex":"<b>I love my family.</b> 나는 우리 가족을 사랑해요."},
     {"w":"luggage","pos":"n.","mean":"짐, 수하물","ex":"<b>This is my luggage.</b> 이것은 제 짐이에요."}
   ],
   "quiz":[
     {"q":"\"탑승구가 어디예요?\"를 영어로 알맞게 표현한 것은?","opts":["Where is the gate?","When is the gate?","Who is the gate?"],"a":0},
     {"q":"\"boarding pass\"의 뜻으로 알맞은 것은?","opts":["공항","탑승권","화장실"],"a":1},
     {"q":"\"이쪽은 제 가족이에요.\"를 영어로 알맞게 표현한 것은?","opts":["This is my family.","This is my gate.","This is my luggage."],"a":0},
     {"q":"화장실을 찾을 때 알맞은 표현은?","opts":["Where is the restroom?","Where is the airport?","Where is the family?"],"a":0}
   ],
   "dict":[
     {"en":"Where is the gate?","ko":"탑승구가 어디예요?"},
     {"en":"Here is my boarding pass.","ko":"여기 제 탑승권이에요."},
     {"en":"This is my family.","ko":"이쪽은 제 가족이에요."}
   ],
   "hw":{"prompt":"공항에 도착한 우리 가족을 상상하며, 오늘 배운 표현으로 짧은 대화를 영어로 써 보세요.","placeholder":"Where is the gate?\nIt's over there.\nThis is my family. We are going to Jeju!","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:30","en":"We are at the airport.","ko":"우리는 공항에 있어요."},
     {"ts":"02:10","en":"Where is the gate?","ko":"탑승구가 어디예요?"},
     {"ts":"05:45","en":"Here is my boarding pass.","ko":"여기 제 탑승권이에요."},
     {"ts":"09:20","en":"Where is the restroom?","ko":"화장실이 어디예요?"},
     {"ts":"13:05","en":"This is my family. We are going to Jeju.","ko":"이쪽은 제 가족이에요. 우리는 제주에 가요."}
   ]},
  {"id":"4-2","sec":3,"title":"4-2. 길 묻고 답하기","duration":"13:40","watchPct":0,
   "intro":"여행지에서 길을 잃으면 어떡하죠? 걱정 마세요! 이번 강에서는 <b style=\"color:var(--color-primary)\">How do I get to ~?</b> 패턴으로 길을 묻고, 방향을 답하는 법을 배워요.",
   "expr":[
     {"en":"How do I get to the park?","ko":"공원에 어떻게 가요?","ex":"<b>A:</b> How do I get to the park? (공원에 어떻게 가요?) <b>B:</b> Go straight. (직진하세요.)"},
     {"en":"Go straight.","ko":"직진하세요.","ex":"<b>A:</b> How do I get there? (거기 어떻게 가요?) <b>B:</b> Go straight and turn left. (직진하다가 왼쪽으로 도세요.)"},
     {"en":"Turn left.","ko":"왼쪽으로 도세요.","ex":"<b>A:</b> Where is the store? (가게가 어디예요?) <b>B:</b> Turn left at the corner. (모퉁이에서 왼쪽으로 도세요.)"},
     {"en":"Turn right.","ko":"오른쪽으로 도세요.","ex":"<b>A:</b> And then? (그다음은요?) <b>B:</b> Turn right. (오른쪽으로 도세요.)"},
     {"en":"It's next to the bank.","ko":"그것은 은행 옆에 있어요.","ex":"<b>A:</b> Where is it? (그게 어디 있어요?) <b>B:</b> It's next to the bank. (은행 옆에 있어요.)"}
   ],
   "vocab":[
     {"w":"straight","pos":"adv.","mean":"똑바로, 직진으로","ex":"<b>Go straight, please.</b> 직진해 주세요."},
     {"w":"left","pos":"n.","mean":"왼쪽","ex":"<b>Turn left here.</b> 여기서 왼쪽으로 도세요."},
     {"w":"right","pos":"n.","mean":"오른쪽","ex":"<b>The shop is on your right.</b> 가게는 오른쪽에 있어요."},
     {"w":"corner","pos":"n.","mean":"모퉁이, 코너","ex":"<b>It's at the corner.</b> 그것은 모퉁이에 있어요."},
     {"w":"next to","pos":"prep.","mean":"~ 옆에","ex":"<b>It's next to the school.</b> 그것은 학교 옆에 있어요."},
     {"w":"map","pos":"n.","mean":"지도","ex":"<b>Let's look at the map.</b> 지도를 봐요."}
   ],
   "quiz":[
     {"q":"\"공원에 어떻게 가요?\"를 영어로 알맞게 표현한 것은?","opts":["How do I get to the park?","Where do I get the park?","When do I get the park?"],"a":0},
     {"q":"\"Turn left.\"의 뜻으로 알맞은 것은?","opts":["직진하세요.","왼쪽으로 도세요.","오른쪽으로 도세요."],"a":1},
     {"q":"\"직진하세요.\"를 영어로 알맞게 표현한 것은?","opts":["Go straight.","Turn right.","Stop here."],"a":0},
     {"q":"\"next to\"의 뜻으로 알맞은 것은?","opts":["~ 앞에","~ 옆에","~ 뒤에"],"a":1}
   ],
   "dict":[
     {"en":"How do I get to the park?","ko":"공원에 어떻게 가요?"},
     {"en":"Go straight and turn left.","ko":"직진하다가 왼쪽으로 도세요."},
     {"en":"It's next to the bank.","ko":"그것은 은행 옆에 있어요."}
   ],
   "hw":{"prompt":"우리 집에서 가까운 장소(공원, 가게 등)로 가는 길을 오늘 배운 표현으로 영어로 설명해 보세요.","placeholder":"How do I get to the park?\nGo straight and turn right.\nIt's next to the bank.","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:25","en":"How do I get to the park?","ko":"공원에 어떻게 가요?"},
     {"ts":"03:15","en":"Go straight.","ko":"직진하세요."},
     {"ts":"06:30","en":"Turn left at the corner.","ko":"모퉁이에서 왼쪽으로 도세요."},
     {"ts":"09:50","en":"Then turn right.","ko":"그다음 오른쪽으로 도세요."},
     {"ts":"12:20","en":"It's next to the bank.","ko":"그것은 은행 옆에 있어요."}
   ]},
  {"id":"4-3","sec":3,"title":"4-3. 식당에서 주문하기","duration":"18:05","watchPct":0,
   "intro":"가족과 함께 식당에 왔어요! 맛있는 음식을 주문해 볼까요? 이번 강에서는 <b style=\"color:var(--color-primary)\">Can I have ~, please?</b> 패턴으로 공손하게 주문하는 법을 배워요.",
   "expr":[
     {"en":"Can I have the menu, please?","ko":"메뉴 좀 주시겠어요?","ex":"<b>A:</b> Can I have the menu, please? (메뉴 좀 주시겠어요?) <b>B:</b> Here you are. (여기 있어요.)"},
     {"en":"I'd like a pizza.","ko":"피자 하나 주세요.","ex":"<b>A:</b> What would you like? (무엇을 드릴까요?) <b>B:</b> I'd like a pizza. (피자 하나 주세요.)"},
     {"en":"Can I have some water, please?","ko":"물 좀 주시겠어요?","ex":"<b>A:</b> Can I have some water, please? (물 좀 주시겠어요?) <b>B:</b> Sure. (그럼요.)"},
     {"en":"How much is it?","ko":"얼마예요?","ex":"<b>A:</b> How much is it? (얼마예요?) <b>B:</b> It's ten dollars. (10달러예요.)"},
     {"en":"Thank you very much.","ko":"정말 감사합니다.","ex":"<b>A:</b> Enjoy your meal! (맛있게 드세요!) <b>B:</b> Thank you very much. (정말 감사합니다.)"}
   ],
   "vocab":[
     {"w":"menu","pos":"n.","mean":"메뉴, 차림표","ex":"<b>Here is the menu.</b> 여기 메뉴예요."},
     {"w":"order","pos":"v.","mean":"주문하다","ex":"<b>Let's order now.</b> 이제 주문해요."},
     {"w":"water","pos":"n.","mean":"물","ex":"<b>I want some water.</b> 나는 물을 좀 원해요."},
     {"w":"delicious","pos":"adj.","mean":"맛있는","ex":"<b>The food is delicious.</b> 음식이 맛있어요."},
     {"w":"bill","pos":"n.","mean":"계산서","ex":"<b>Can I have the bill, please?</b> 계산서 좀 주시겠어요?"},
     {"w":"thank you","pos":"phr.","mean":"감사합니다","ex":"<b>Thank you for the meal.</b> 식사 감사합니다."}
   ],
   "quiz":[
     {"q":"\"메뉴 좀 주시겠어요?\"를 영어로 알맞게 표현한 것은?","opts":["Can I have the menu, please?","Where is the menu?","What is the menu?"],"a":0},
     {"q":"\"얼마예요?\"를 영어로 알맞게 표현한 것은?","opts":["How are you?","How much is it?","How old is it?"],"a":1},
     {"q":"\"delicious\"의 뜻으로 알맞은 것은?","opts":["맛있는","비싼","뜨거운"],"a":0},
     {"q":"음식을 공손하게 주문할 때 알맞은 표현은?","opts":["I'd like a pizza.","Give me pizza now!","Where is pizza?"],"a":0}
   ],
   "dict":[
     {"en":"Can I have the menu, please?","ko":"메뉴 좀 주시겠어요?"},
     {"en":"I'd like a pizza.","ko":"피자 하나 주세요."},
     {"en":"How much is it?","ko":"얼마예요?"}
   ],
   "hw":{"prompt":"가족과 식당에 간 상황을 상상하며, 오늘 배운 표현으로 음식을 주문하는 대화를 영어로 써 보세요.","placeholder":"Can I have the menu, please?\nI'd like a pizza and some water.\nHow much is it? Thank you very much!","checks":["영상을 끝까지 봤어요 (완청)","핵심표현 5개를 소리 내어 읽었어요","단어 6개를 외웠어요"]},
   "transcript":[
     {"ts":"00:40","en":"Can I have the menu, please?","ko":"메뉴 좀 주시겠어요?"},
     {"ts":"04:10","en":"I'd like a pizza.","ko":"피자 하나 주세요."},
     {"ts":"08:25","en":"Can I have some water, please?","ko":"물 좀 주시겠어요?"},
     {"ts":"13:15","en":"How much is it?","ko":"얼마예요?"},
     {"ts":"16:50","en":"Thank you very much.","ko":"정말 감사합니다."}
   ]}
];
const LESSONS={}; LESSON_LIST.forEach(l=>{ LESSONS[l.id]=l; });

/* ----- 진도 모델 + 파생 지표 ----- */
function _dStr(d){ return d.toISOString().slice(0,10); }
function todayStr(){ return _dStr(new Date()); }
function daysAgo(n){ const x=new Date(); x.setDate(x.getDate()-n); return _dStr(x); }

function seedProgress(){
  // 데모 기준: 섹션1 완료 + 최근 7일 연속 학습(상대 날짜라 항상 '이번 주'로 보임)
  return {
    done:{ '1-1':daysAgo(6), '1-2':daysAgo(5), '1-3':daysAgo(4) },
    study:{ [daysAgo(6)]:20,[daysAgo(5)]:25,[daysAgo(4)]:12,[daysAgo(3)]:31,[daysAgo(2)]:18,[daysAgo(1)]:15,[daysAgo(0)]:9 },
    quiz:{}, units:{}, baseMin:1010
  };
}
function getProgress(){
  let p=null; try{ p=JSON.parse(localStorage.getItem(PROGRESS_KEY)); }catch(e){}
  if(!p){ p=seedProgress(); try{ localStorage.setItem(PROGRESS_KEY,JSON.stringify(p)); }catch(e){} }
  p.done=p.done||{}; p.study=p.study||{}; p.quiz=p.quiz||{}; p.units=p.units||{};
  return p;
}
function saveProgress(p){ try{ localStorage.setItem(PROGRESS_KEY,JSON.stringify(p)); }catch(e){} }

// 레슨 완료 기록 (player의 '강의 완료' 클릭에서만 호출 → 재방문 시 중복 가산 방지)
function recordLessonDone(id, quizScore, quizTotal){
  const p=getProgress(), t=todayStr();
  if(!p.done[id]) p.done[id]=t;
  p.study[t]=(p.study[t]||0)+LESSON_MIN;
  if(quizScore!=null) p.quiz[id]={score:quizScore, total:quizTotal||4, date:t};
  saveProgress(p);
}

/* ----- 파생 지표 ----- */
function lessonsDone(){ const p=getProgress(); return ALL_LESSONS.filter(l=>p.done[l]); }
function courseProgressPct(){ return Math.round(lessonsDone().length/ALL_LESSONS.length*100); }
/* 단원평가 마스터 지표(통과 기준은 단원평가와 동일: 60%) */
function unitsPassedCount(){ const p=getProgress(); return UNITS.filter(u=>{const r=p.units[u.key]; return r && r.score>=Math.ceil(r.total*0.6);}).length; }
function allUnitsPassed(){ return unitsPassedCount()===UNITS.length; }
function unitAvgPct(){ const p=getProgress(); let s=0,t=0; UNITS.forEach(u=>{const r=p.units[u.key]; if(r){s+=r.score;t+=r.total;}}); return t?Math.round(s/t*100):0; }
function totalStudyHours(){ const p=getProgress(); const sum=Object.keys(p.study).reduce((a,k)=>a+p.study[k],0)+(p.baseMin||0); return sum/60; }
function studyStreak(){ const p=getProgress(); let i=(p.study[daysAgo(0)]>0)?0:1, n=0;
  for(;i<120;i++){ if(p.study[daysAgo(i)]>0) n++; else break; } return n; }
function weekDays(){ // 이번 주 월~일
  const now=new Date(), dow=(now.getDay()+6)%7, mon=new Date(now); mon.setDate(now.getDate()-dow);
  const p=getProgress(), L=['월','화','수','목','금','토','일'], out=[];
  for(let i=0;i<7;i++){ const dt=new Date(mon); dt.setDate(mon.getDate()+i); const ds=_dStr(dt);
    out.push({label:L[i], date:ds, min:p.study[ds]||0, today:ds===todayStr(), future:dt>now}); }
  return out;
}
function heatLevel(min){ return min<=0?'':(min<16?'l1':(min<26?'l2':'l3')); }
function quizAvg(){ const p=getProgress(), ks=Object.keys(p.quiz); if(!ks.length) return null;
  let s=0,t=0; ks.forEach(k=>{ s+=p.quiz[k].score; t+=p.quiz[k].total; }); return {score:s,total:t,pct:Math.round(s/t*100)}; }

/* ----- 단원평가 문제은행 ----- */
const UNIT_BANK={
  0:[ // 섹션 1. 워밍업 — 인사하고 나 소개하기
    {q:"처음 만난 사람에게 \"만나서 반가워요\"라고 인사할 때 알맞은 말은?",opts:["Nice to meet you.","See you tomorrow.","I'm hungry."],a:0,e:"처음 만났을 땐 'Nice to meet you.' — 'See you'는 헤어질 때 쓰는 말이에요."},
    {q:"\"How are you?\"라는 질문에 어울리지 <b>않는</b> 대답은?",opts:["I'm good, thank you.","I'm fine.","Goodbye!"],a:2,e:"'How are you?'는 안부를 묻는 말이라 작별 인사 'Goodbye!'는 어울리지 않아요."},
    {q:"내 이름을 소개할 때 빈칸에 알맞은 말은?  \"____ Minji.\"",opts:["My name is","How are","Thank you"],a:0,e:"이름을 말할 땐 'My name is ~'로 시작해요."},
    {q:"\"저는 열두 살이에요\"를 영어로 바르게 말한 것은?",opts:["I'm twelve years old.","I'm twelve o'clock.","I have twelve."],a:0,e:"나이는 'I'm + 숫자 + years old'로 말해요. o'clock은 시각이에요."},
    {q:"가족을 소개하며 \"이 사람은 우리 형이에요\"에 알맞은 표현은?",opts:["This is my brother.","She is my school.","This is my lunch."],a:0,e:"사람을 소개할 땐 'This is my ~'를 써요."},
    {q:"오랜만에 만난 친구에게 할 수 있는 인사는?",opts:["Long time no see!","What's for lunch?","Turn left."],a:0,e:"오랜만에 만났을 땐 'Long time no see!'라고 해요."},
    {q:"상대가 안부를 묻고 나서 \"너는 어때?\"라고 되물을 때 쓰는 말은?",opts:["And you?","Me too tired.","I'm a student."],a:0,e:"안부를 되물을 땐 짧게 'And you?'라고 해요."},
    {q:"헤어질 때 하는 인사로 알맞은 것은?",opts:["See you tomorrow!","Nice to meet you.","Here you are."],a:0,e:"'내일 봐'는 'See you tomorrow!' — 'Nice to meet you.'는 처음 만날 때 써요."}
  ],
  1:[ // 섹션 2. 학교 생활 영어
    {q:"수업 중 \"질문 하나 해도 될까요?\"라고 정중히 물을 때 알맞은 말은?",opts:["Can I ask a question?","Let's play soccer.","I'm full."],a:0,e:"정중히 질문 허락을 구할 땐 'Can I ask a question?'이에요."},
    {q:"선생님 설명을 못 알아들었을 때 \"다시 한 번 말씀해 주시겠어요?\"는?",opts:["Could you say that again, please?","What time is it?","This is my dad."],a:0,e:"다시 말해 달라고 부탁할 땐 'Could you say that again, please?'예요."},
    {q:"\"제가 가장 좋아하는 과목은 과학이에요\"를 바르게 말한 것은?",opts:["My favorite subject is science.","I have a science.","Science is play."],a:0,e:"가장 좋아하는 과목은 'My favorite subject is ~'로 말해요."},
    {q:"친구에게 \"우리 같이 놀래?\"라고 제안하는 말은?",opts:["Do you want to play together?","May I go home?","I don't understand."],a:0,e:"같이 하자고 제안할 땐 'Do you want to ~?'를 써요."},
    {q:"\"이 단어 무슨 뜻이에요?\"라고 물을 때 알맞은 표현은?",opts:["What does this word mean?","Where is the bank?","I'd like a pizza."],a:0,e:"단어 뜻을 물을 땐 'What does this word mean?'이에요."},
    {q:"취미를 물어볼 때 알맞은 질문은?",opts:["What's your hobby?","How much is it?","What's for lunch?"],a:0,e:"취미를 물을 땐 'What's your hobby?'예요. 'How much'는 가격을 물을 때 써요."},
    {q:"화장실에 가도 되는지 정중히 허락을 구하는 말은?",opts:["May I go to the restroom?","Let's go to the airport.","I'm twelve years old."],a:0,e:"정중한 허락은 'May I ~?' — 'May I go to the restroom?'이에요."},
    {q:"\"오늘 급식 메뉴가 뭐예요?\"에 알맞은 표현은?",opts:["What's for lunch today?","What time do you get up?","Where is the library?"],a:0,e:"점심 메뉴를 물을 땐 'What's for lunch?'예요."}
  ],
  2:[ // 섹션 3. 내 하루 이야기하기
    {q:"\"지금 몇 시예요?\"라고 시간을 묻는 말은?",opts:["What time is it?","What's your name?","How are you?"],a:0,e:"시간을 물을 땐 'What time is it?'이에요."},
    {q:"\"3시예요\"를 영어로 바르게 말한 것은?",opts:["It's three o'clock.","It's three years old.","I'm three."],a:0,e:"정각은 'It's + 숫자 + o'clock'으로 말해요. years old는 나이예요."},
    {q:"\"저는 아침 7시에 일어나요\"에 알맞은 표현은?",opts:["I get up at seven.","I go to bed now.","I'm seven o'clock."],a:0,e:"일어나는 시각은 'I get up at + 시간'으로 말해요."},
    {q:"요일(day)을 나타내는 단어가 <b>아닌</b> 것은?",opts:["Monday","Friday","August"],a:2,e:"August는 '8월'이라 요일이 아니에요. Monday·Friday가 요일이에요."},
    {q:"친구에게 \"시간 있어?\"라고 물어볼 때 쓰는 말은?",opts:["Are you free?","Are you hungry?","Are you ten?"],a:0,e:"시간 있는지 물을 땐 'Are you free?'예요."},
    {q:"\"학교 끝나고 만나자\"에 알맞은 표현은?",opts:["Let's meet after school.","Let's go to bed.","I do my homework."],a:0,e:"'~하자'고 제안할 땐 'Let's ~' — 'Let's meet after school.'이에요."},
    {q:"하루 일과를 말할 때 \"저는 저녁에 숙제를 해요\"는?",opts:["I do my homework in the evening.","I have a homework now.","I am homework."],a:0,e:"일과는 'I + 동사 + 시간'으로 말해요. 'in the evening'은 저녁에예요."},
    {q:"문자로 약속을 정할 때 \"내일 3시에 어때?\"에 알맞은 말은?",opts:["How about three tomorrow?","What does it mean?","Turn right."],a:0,e:"제안할 땐 'How about ~?' — 'How about three tomorrow?'예요."}
  ],
  3:[ // 섹션 4. 가족 나들이·여행 영어
    {q:"공항에서 \"제 탑승권이 여기 있어요\"에 알맞은 표현은?",opts:["Here is my boarding pass.","Here is my lunch.","Here is my homework."],a:0,e:"'~가 여기 있어요'는 'Here is my ~'예요. boarding pass는 탑승권이에요."},
    {q:"길을 물을 때 \"화장실이 어디예요?\"는?",opts:["Where is the restroom?","What time is it?","How are you?"],a:0,e:"위치를 물을 땐 'Where is ~?'예요."},
    {q:"\"쭉 가세요\"라고 길을 안내하는 말은?",opts:["Go straight.","Sit down.","Stand up."],a:0,e:"길 안내 '쭉 가세요'는 'Go straight.'예요."},
    {q:"\"왼쪽으로 도세요\"에 알맞은 표현은?",opts:["Turn left.","Look up.","Come here."],a:0,e:"'왼쪽으로 도세요'는 'Turn left.' — 오른쪽은 'Turn right.'예요."},
    {q:"식당에서 \"메뉴 좀 주시겠어요?\"라고 정중히 부탁하는 말은?",opts:["Can I get the menu, please?","Can I go home?","Can you run?"],a:0,e:"정중히 부탁할 땐 'Can I get ~, please?'를 써요."},
    {q:"음식을 주문할 때 \"저는 피자로 할게요\"는?",opts:["I'd like a pizza.","I'm a pizza.","I have pizza school."],a:0,e:"주문할 땐 'I'd like ~'로 말해요. ('I would like'의 줄임말)"},
    {q:"길을 알려준 사람에게 할 인사로 알맞은 것은?",opts:["Thank you very much!","Goodbye, twelve!","Turn left, please."],a:0,e:"도움을 받았을 땐 감사 인사 'Thank you very much!'를 해요."},
    {q:"여행 중 \"여기서 사진 찍어도 될까요?\"라고 허락을 구하는 말은?",opts:["Can I take a picture here?","Can I eat the menu?","What's your hobby?"],a:0,e:"사진 찍어도 되는지 물을 땐 'Can I take a picture (here)?'예요."}
  ]
};
const UNITS=CURRICULUM.map((s,i)=>{
  const bank=UNIT_BANK[i];
  const pool=(bank&&bank.length)?bank:s.lessons.reduce((a,id)=>a.concat((LESSONS[id]&&LESSONS[id].quiz)||[]),[]);
  return { key:'u'+(i+1), sec:i,
    title:'섹션 '+(i+1)+' 단원평가 · '+s.sec.replace(/^섹션\s*\d+\.\s*/,''),
    q:pool };
});
function unitUnlocked(u){ const p=getProgress(); return CURRICULUM[u.sec].lessons.every(l=>p.done[l]); }

/* ----- player 렌더 + 학습 워크스페이스 ----- */
function lessonBodyHTML(L){
  const expr=L.expr.map(e=>`<div class="expr"><button class="play" data-act="toast" data-msg="${escapeAttr(e.en)} 듣기"><i class="icn icn-volume"></i></button><div class="en">${e.en}</div><div class="ko">${e.ko}</div><div class="ex">${e.ex}</div></div>`).join('');
  const vocab=L.vocab.map(v=>`<div class="vcard" data-w="${escapeAttr(v.w)}"><button class="vknow" aria-label="외움 체크"><i class="icn icn-check"></i></button><div class="w">${v.w}<span class="pos">${v.pos}</span></div><div class="mean">${v.mean}</div><div class="vflip">예문 보기 ▾</div><div class="ex">${v.ex}</div></div>`).join('');
  const quiz=L.quiz.map((q,i)=>`<div class="rq"><div class="qq"><span class="n">Q${i+1}.</span> ${q.q}</div>${q.opts.map((o,j)=>`<button class="rq-opt"${j===q.a?' data-correct="1"':''}>${o}</button>`).join('')}</div>`).join('');
  const dict=L.dict.map((d,i)=>`<div class="dict"><div class="dn"><button class="play" data-act="toast" data-msg="문장 ${i+1} 재생"><i class="icn icn-volume"></i> 문장 ${i+1} 듣기</button> 받아쓴 뒤 정답 확인</div><div class="ans">${d.en}</div><div class="ko">${d.ko}</div><div class="reveal"><button class="btn btn-ghost btn-sm" data-lact="dict-reveal">정답 보기</button></div></div>`).join('');
  const checks=L.hw.checks.map(c=>`<label><input type="checkbox"> ${c}</label>`).join('');
  const script=L.transcript.map((t,i)=>`<a class="ln${i===0?' cur':''}" data-act="toast" data-msg="${t.ts} 구간으로 이동"><span class="ts">${t.ts}</span><span><span class="en">${t.en}</span><span class="ko">${t.ko}</span></span></a>`).join('');
  const notes=L.expr.slice(0,2).map((e,i)=>`<div class="noteitem"><span class="nt">${L.transcript[i]?L.transcript[i].ts:'00:00'}</span><span>"${e.en}" = ${e.ko}</span></div>`).join('');
  const wp=L.watchPct||0;
  return `<h1 style="font-size:18px;font-weight:800;margin-bottom:6px">${L.title}</h1>
  <p class="muted" style="font-size:13px;line-height:1.6;margin-bottom:12px">${L.intro}</p>
  <div class="gaugewrap">
    <div class="gauge" style="--p:${wp}"><b>${wp}%</b></div>
    <div class="gw-info" data-gauge-info><b>완청 진행률 ${wp}%</b><br>실제 시청 구간 기준 · 완청 인증까지 <b style="color:var(--color-primary)">${100-wp}%</b> 남음</div>
    <button class="btn btn-ghost btn-sm" data-lact="watch" style="margin-left:auto;white-space:nowrap">완청 인증 <i class="icn icn-play"></i></button>
  </div>
  <div class="tabs scroll">
    <span class="tab on" data-tab="expr">핵심표현</span>
    <span class="tab" data-tab="vocab">단어장</span>
    <span class="tab" data-tab="quiz">복습 퀴즈</span>
    <span class="tab" data-tab="dict">받아쓰기</span>
    <span class="tab" data-tab="hw">숙제</span>
    <span class="tab" data-tab="script">자막</span>
    <span class="tab" data-tab="note">노트</span>
    <span class="tab" data-tab="qa">Q&A</span>
  </div>
  <div data-panel="expr"><div class="lsec-head"><h2>오늘의 핵심표현 ${L.expr.length}</h2><span class="muted">자주 쓰는 문장부터 익혀요</span></div><div class="exprlist">${expr}</div></div>
  <div data-panel="vocab" style="display:none"><div class="lsec-head"><h2>오늘의 단어 ${L.vocab.length}</h2><span class="muted">카드를 눌러 예문 보기 · 오른쪽 ○로 외운 단어 체크</span></div><div class="vocabhead"><b>외운 단어</b><span class="vbar"><i data-vocab-bar></i></span><b data-vocab-count>0 / ${L.vocab.length}</b></div><div class="vocabgrid">${vocab}</div></div>
  <div data-panel="quiz" style="display:none"><div class="lsec-head"><h2>복습 퀴즈 ${L.quiz.length}문항</h2><span class="muted">3개 이상 맞히면 통과</span></div><div class="quizbar"><span class="sc" data-quiz-score>0</span><span>/ ${L.quiz.length} 정답</span><span class="muted" style="margin-left:auto;font-size:12px">문항을 누르면 바로 채점돼요</span></div>${quiz}<div class="quizresult" data-quiz-result></div></div>
  <div data-panel="dict" style="display:none"><div class="lsec-head"><h2>받아쓰기 ${L.dict.length}문장</h2><span class="muted">듣고 받아쓴 뒤 정답을 확인하세요</span></div>${dict}</div>
  <div data-panel="hw" style="display:none"><div class="lsec-head"><h2>오늘의 숙제</h2><span class="muted">제출하면 선생님이 확인해요</span></div><div class="hwbox"><div style="font-size:13px;font-weight:700;margin-bottom:4px">${L.hw.prompt}</div><textarea placeholder="${escapeAttr(L.hw.placeholder)}"></textarea><div style="font-size:13px;font-weight:700;margin:15px 0 4px">셀프 체크</div><div class="hwcheck">${checks}</div><div class="hbar"><span><i class="icn icn-clock"></i> 자동 임시저장됨</span><button class="btn btn-primary btn-sm" data-lact="hw-submit">숙제 제출</button></div></div></div>
  <div data-panel="script" style="display:none"><div class="muted" style="font-size:11.5px;margin-bottom:8px">자막 클릭 시 해당 구간으로 이동합니다 · 한/영 동시 표시</div><div class="transcript">${script}</div></div>
  <div data-panel="note" style="display:none"><div class="notebox"><textarea placeholder="이 강의에 메모를 남겨보세요…"></textarea><div class="nbar"><span>현재 시점에 저장됩니다</span><button class="btn btn-primary btn-sm" data-act="toast" data-msg="메모를 저장했습니다">저장</button></div></div>${notes}<div style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-act="toast" data-msg="${escapeAttr(L.title)} 자료 PDF 다운로드"><i class="icn icn-download"></i> 핵심표현·단어 PDF</button></div></div>
  <div data-panel="qa" style="display:none"><p class="muted" style="font-size:13.5px;line-height:1.7">이 강의에서 막히는 부분은 <a href="/qna" style="color:var(--color-primary);font-weight:700">Q&A 게시판</a>에 질문하면 <b style="color:var(--color-text)">김하영 원장 선생님</b>이 직접 답변해요. 보통 24시간 안에 답이 달려요.</p></div>
  <div class="completebar" data-complete-reqs><h3>이 강의 완료하기</h3><div class="creqs"><div class="creq" data-req="watch"><span class="cb"><i class="icn icn-check"></i></span> 완청 인증 — 영상 전 구간 시청</div><div class="creq" data-req="quiz"><span class="cb"><i class="icn icn-check"></i></span> 복습 퀴즈 통과 — ${L.quiz.length}문항 중 3개 이상</div></div><div class="nextrow"><button class="btn btn-block" data-complete-btn disabled>강의 완료하고 다음 강 열기</button></div></div>`;
}
/* ----- 재생목록 렌더(진도·잠금 반영) ----- */
function lessonPlaylistHTML(currentId){
  const p=getProgress();
  let firstNotDone=ALL_LESSONS.findIndex(id=>!p.done[id]); if(firstNotDone<0) firstNotDone=ALL_LESSONS.length;
  let html='';
  CURRICULUM.forEach(sec=>{
    html+=`<div class="sh">${sec.sec}</div>`;
    sec.lessons.forEach(id=>{
      const L=LESSONS[id]; if(!L) return;
      const idx=ALL_LESSONS.indexOf(id);
      const done=!!p.done[id], isCur=id===currentId;
      const locked=!done && !isCur && idx>firstNotDone;
      let ck, cls='it';
      if(done) ck='<span class="ck done"><i class="icn icn-check"></i></span>';
      else if(isCur){ ck='<span class="ck cur"><i class="icn icn-play"></i></span>'; cls+=' cur'; }
      else if(locked){ ck='<span class="ck"><i class="icn icn-lock"></i></span>'; cls+=' locked'; }
      else ck='<span class="ck"></span>';
      const label=isCur?`<b style="color:var(--color-primary)">${L.title}</b>`:L.title;
      const href=locked?'#':`/player?lesson=${id}`;
      html+=`<a class="${cls}" href="${href}"${locked?' data-locked="1"':''}>${ck} ${label}</a>`;
    });
  });
  return html;
}
/* ----- 상단바·영상 오버레이 퀴즈 세팅 ----- */
function setupPlayerChrome(L){
  document.title='수강 · '+L.title.replace(/^[\d-]+\.\s*/,'')+' · EPIC';
  const wp=L.watchPct||0;
  const pt=document.querySelector('.ptop .prog'); if(pt&&pt.firstChild) pt.firstChild.textContent='진도 '+wp+'%';
  const pb=document.querySelector('.ptop .prog .pbar i'); if(pb) pb.style.width=wp+'%';
  applySectionClear(L);
  const card=document.querySelector('.quiz-overlay .quiz');
  if(card&&L.quiz&&L.quiz[0]){ const q=L.quiz[0];
    card.innerHTML='<div class="badge accent" style="margin-bottom:10px"><i class="icn icn-pause"></i> 진행 퀴즈 · 정답 시 계속 재생</div>'
      +'<div style="font-weight:700;font-size:15px;margin-bottom:14px">'+q.q+'</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px">'
      +q.opts.map((o,j)=>'<button class="btn btn-ghost quiz-opt" style="justify-content:flex-start"'+(j===q.a?' data-correct="1"':'')+'>'+(_ORD[j]||'')+' '+o+'</button>').join('')
      +'</div><div class="muted" style="font-size:11px;margin-top:12px">정답을 선택해야 다음 구간으로 진행됩니다.</div>';
  }
}

/* ----- 섹션 클리어 🏅: 현재 강의가 속한 섹션의 단원평가를 통과했으면
   상단 진도 옆 배지 + 영상 프레임 메달 리본을 노출 ----- */
function applySectionClear(L){
  const secIdx=(typeof L.sec==='number')?L.sec:CURRICULUM.findIndex(s=>s.lessons.includes(L.id));
  const prog=(typeof getProgress==='function')?getProgress():null;
  const u=prog&&prog.units&&secIdx>=0?prog.units['u'+(secIdx+1)]:null;
  const passed=u&&u.score>=Math.ceil(u.total*0.6);
  // (1) 상단바 진도 옆 배지
  const prg=document.querySelector('.ptop .prog');
  let tb=document.querySelector('.ptop .clearbadge');
  if(passed){
    if(!tb&&prg){ tb=document.createElement('span'); tb.className='clearbadge'; prg.insertAdjacentElement('afterend',tb); }
    if(tb){ tb.hidden=false; tb.innerHTML='<i class="icn icn-medal"></i> 섹션'+(secIdx+1)+' 클리어'; tb.title='단원평가 통과 '+u.score+'/'+u.total; }
  } else if(tb){ tb.hidden=true; }
  // (2) 영상 프레임 메달 리본 (퀴즈 오버레이 위에 표시)
  const video=document.querySelector('.video');
  let rb=video&&video.querySelector('.clearbanner');
  if(passed&&video){
    if(!rb){ rb=document.createElement('div'); rb.className='clearbanner'; video.appendChild(rb); }
    rb.hidden=false; rb.innerHTML='<i class="icn icn-medal"></i> <b>섹션'+(secIdx+1)+' 클리어!</b> 단원평가 '+u.score+'/'+u.total+'점';
  } else if(rb){ rb.hidden=true; }
}

/* ----- 강의실 학습 워크스페이스: 데이터 기반 렌더 + 단어장·퀴즈·받아쓰기·완청→완료 게이팅 ----- */
function initLesson(){
  const root=document.querySelector('[data-lesson]'); if(!root) return;
  // 현재 강의 결정: ?lesson=id (없거나 잘못되면 다음 학습 강)
  const params=new URLSearchParams(location.search);
  let id=params.get('lesson');
  if(!id||!LESSONS[id]) id=nextLesson().id;
  const L=LESSONS[id];
  // 본문·재생목록·상단바 렌더
  root.innerHTML=lessonBodyHTML(L);
  root.setAttribute('data-lesson-id',id);
  const pl=document.querySelector('.pl'); if(pl) pl.innerHTML=lessonPlaylistHTML(id);
  setupPlayerChrome(L);
  // 잠긴 강의 클릭 가드
  if(pl) pl.addEventListener('click',e=>{ const a=e.target.closest('[data-locked]'); if(a){ e.preventDefault(); toast('이전 강의를 먼저 완료해 주세요'); } });

  const LS='epic-lesson-'+id;
  let st={known:{}}; try{ st=Object.assign({known:{}},JSON.parse(localStorage.getItem(LS))||{}); }catch(e){}
  const save=()=>{ try{ localStorage.setItem(LS,JSON.stringify(st)); }catch(e){} };

  // --- 단어장: 외운 단어 복원 + 진행률 ---
  function syncVocab(){
    const cards=[...root.querySelectorAll('.vcard')];
    cards.forEach(c=>{ if(st.known[c.dataset.w]) c.classList.add('known'); });
    const known=cards.filter(c=>c.classList.contains('known')).length;
    const bar=root.querySelector('[data-vocab-bar]'), lbl=root.querySelector('[data-vocab-count]');
    if(bar) bar.style.width=(cards.length?Math.round(known/cards.length*100):0)+'%';
    if(lbl) lbl.textContent=known+' / '+cards.length;
  }

  // --- 복습 퀴즈: 채점 ---
  function gradeQuiz(){
    const qs=[...root.querySelectorAll('.rq')];
    const answered=qs.filter(q=>q.dataset.result!==undefined&&q.dataset.result!=='');
    const correct=qs.filter(q=>q.dataset.result==='1').length;
    const scEl=root.querySelector('[data-quiz-score]'); if(scEl) scEl.textContent=correct;
    const res=root.querySelector('[data-quiz-result]');
    if(answered.length===qs.length){
      const pass=correct>=3;
      if(res){
        res.className='quizresult show '+(pass?'pass':'fail');
        res.innerHTML=(pass?'통과! ':'아쉬워요 ')+correct+' / '+qs.length+' 정답'
          +(pass?'<div class="rst">복습 퀴즈를 통과했어요. 이제 강의를 완료할 수 있어요.</div>'
                :'<div class="rst">3개 이상 맞히면 통과예요. 다시 풀어볼까요?<br><button class="btn btn-ghost btn-sm" data-lact="quiz-reset">다시 풀기</button></div>');
      }
      st.quizPassed=pass; st.quizScore=correct; st.quizTotal=qs.length; save(); refreshComplete();
    }
  }
  function resetQuiz(){
    root.querySelectorAll('.rq').forEach(q=>{ q.classList.remove('answered'); delete q.dataset.result;
      q.querySelectorAll('.rq-opt').forEach(o=>{ o.classList.remove('correct','wrong'); const mk=o.querySelector('.mk'); if(mk) mk.remove(); }); });
    const res=root.querySelector('[data-quiz-result]'); if(res){ res.className='quizresult'; res.innerHTML=''; }
    const scEl=root.querySelector('[data-quiz-score]'); if(scEl) scEl.textContent='0';
    st.quizPassed=false; save(); refreshComplete();
  }

  // --- 완청 인증 ---
  function setWatched(){
    st.watched=true; save();
    const g=root.querySelector('.gauge'); if(g){ g.style.setProperty('--p',100); const b=g.querySelector('b'); if(b) b.textContent='100%'; }
    const gi=root.querySelector('[data-gauge-info]'); if(gi) gi.innerHTML='<b style="color:var(--color-success)">완청 인증 완료 <i class="icn icn-check"></i></b><br>전 구간 시청을 마쳤어요 — 이제 강의를 완료할 수 있어요';
    const wb=root.querySelector('[data-lact="watch"]'); if(wb){ wb.innerHTML='완청 완료 <i class="icn icn-check"></i>'; wb.setAttribute('disabled',''); }
    const pb=document.querySelector('.ptop .prog .pbar i'); if(pb) pb.style.width='100%';
    const pt=document.querySelector('.ptop .prog'); if(pt&&pt.firstChild) pt.firstChild.textContent='진도 100%';
    refreshComplete();
  }

  // --- 완료 게이팅 ---
  function refreshComplete(){
    const reqs=root.querySelector('[data-complete-reqs]');
    if(reqs){
      const rw=reqs.querySelector('[data-req="watch"]'); if(rw) rw.classList.toggle('ok',!!st.watched);
      const rq=reqs.querySelector('[data-req="quiz"]'); if(rq) rq.classList.toggle('ok',!!st.quizPassed);
    }
    const btn=root.querySelector('[data-complete-btn]');
    const ready=st.watched&&st.quizPassed;
    if(btn&&!st.lessonDone){ btn.disabled=!ready; btn.classList.toggle('btn-primary',ready); }
  }
  function markDone(){
    st.lessonDone=true; save();
    const bar=root.querySelector('.completebar'); if(bar) bar.classList.add('done');
    const row=root.querySelector('.completebar .nextrow');
    const ni=ALL_LESSONS.indexOf(id)+1, nextId=ALL_LESSONS[ni];
    if(row){
      // 이 강으로 섹션을 방금 끝냈고 단원평가 미응시면 → 단원평가 CTA 노출
      const secIdx=CURRICULUM.findIndex(s=>s.lessons.includes(id));
      const sec=CURRICULUM[secIdx], prog=(typeof getProgress==='function')?getProgress():null;
      const secDone=prog&&sec&&sec.lessons.every(l=>prog.done[l]);
      const unitTaken=prog&&prog.units&&prog.units['u'+(secIdx+1)];
      if(!nextId){
        row.innerHTML='<span class="badge green"><i class="icn icn-check"></i> 전 과정 완주!</span><a class="btn btn-primary btn-sm" href="/mypage" style="margin-left:auto">마이페이지에서 수료 확인 →</a>';
      } else if(secDone && !unitTaken){
        const nt=LESSONS[nextId]?LESSONS[nextId].title:nextId;
        row.innerHTML='<span class="badge green"><i class="icn icn-check"></i> 섹션'+(secIdx+1)+' 완료!</span>'
          +'<a class="btn btn-grad btn-sm" href="/mypage#unittests" style="margin-left:auto"><i class="icn icn-clipboard"></i> 단원평가 응시하러 가기 <span class="arr">→</span></a>'
          +'<a class="btn btn-ghost btn-sm" href="/player?lesson='+nextId+'" style="margin-left:8px" title="'+escapeAttr(nt)+'">다음 강 →</a>';
      } else {
        const nt=LESSONS[nextId]?LESSONS[nextId].title:nextId;
        row.innerHTML='<span class="badge green"><i class="icn icn-check"></i> 이 강의 완료</span><a class="btn btn-primary btn-sm" href="/player?lesson='+nextId+'" style="margin-left:auto" title="'+escapeAttr(nt)+'">다음 강 <span class="arr">→</span></a>';
      }
    }
    // 재생목록 재렌더(완료 표시 + 다음 강 잠금 해제)
    const plx=document.querySelector('.pl'); if(plx) plx.innerHTML=lessonPlaylistHTML(id);
  }

  // --- 저장된 상태 복원 ---
  function restore(){
    syncVocab();
    if(st.watched) setWatched();
    if(st.quizPassed){ const res=root.querySelector('[data-quiz-result]'); if(res){ res.className='quizresult show pass'; res.innerHTML='통과! 복습 퀴즈를 이미 통과했어요.'; } }
    refreshComplete();
    if(st.lessonDone) markDone();
  }
  restore();

  // --- 이벤트(루트 스코프) ---
  root.addEventListener('click',e=>{
    // 외운 단어 체크
    const kn=e.target.closest('.vknow');
    if(kn){ e.stopPropagation(); const card=kn.closest('.vcard'); const on=card.classList.toggle('known');
      st.known[card.dataset.w]=on; save(); syncVocab(); return; }
    // 단어 카드 뒤집기(예문)
    const vc=e.target.closest('.vcard');
    if(vc){ vc.classList.toggle('flipped'); return; }
    // 복습 퀴즈 응답
    const opt=e.target.closest('.rq-opt');
    if(opt){
      const q=opt.closest('.rq'); if(q.classList.contains('answered')) return;
      q.classList.add('answered');
      const ok=opt.dataset.correct==='1';
      q.dataset.result=ok?'1':'0';
      q.querySelectorAll('.rq-opt').forEach(o=>{ if(o.dataset.correct==='1'){ o.classList.add('correct'); o.insertAdjacentHTML('beforeend','<span class="mk"><i class="icn icn-check"></i></span>'); } });
      if(!ok){ opt.classList.add('wrong'); opt.insertAdjacentHTML('beforeend','<span class="mk"><i class="icn icn-x"></i></span>'); }
      gradeQuiz(); return;
    }
    // 레슨 액션
    const la=e.target.closest('[data-lact]'); if(!la) return;
    const a=la.dataset.lact;
    if(a==='watch'){ if(la.hasAttribute('disabled')) return; setWatched(); toast('완청 인증 완료'); }
    else if(a==='quiz-reset'){ resetQuiz(); }
    else if(a==='dict-reveal'){ const d=la.closest('.dict'); if(d) d.classList.add('revealed'); }
    else if(a==='hw-submit'){ toast('숙제를 제출했어요. 선생님이 확인할게요'); la.innerHTML='제출 완료 <i class="icn icn-check"></i>'; la.setAttribute('disabled',''); }
    else if(a==='complete'){ /* reserved */ }
  });

  // 완료 버튼(별도 — disabled 상태 체크)
  const cbtn=root.querySelector('[data-complete-btn]');
  if(cbtn) cbtn.addEventListener('click',()=>{
    if(cbtn.disabled||st.lessonDone) return;
    // 공유 진도 모델에 먼저 기록 → 재생목록 재렌더 시 완료/잠금해제 반영
    if(typeof recordLessonDone==='function') recordLessonDone(id, st.quizScore, st.quizTotal||L.quiz.length);
    markDone();
    const secIdx2=CURRICULUM.findIndex(s=>s.lessons.includes(id));
    const sec2=CURRICULUM[secIdx2], prog2=(typeof getProgress==='function')?getProgress():null;
    const secDone2=prog2&&sec2&&sec2.lessons.every(l=>prog2.done[l]);
    const unitTaken2=prog2&&prog2.units&&prog2.units['u'+(secIdx2+1)];
    if(secDone2&&!unitTaken2) toast('섹션'+(secIdx2+1)+' 완료! 아래 버튼으로 단원평가에 응시해 보세요');
    else toast(id+'강 완료! 마이페이지 진도에 반영됐어요');
  });
}

/* ----- course 커리큘럼 진도 동기화 ----- */
function initCourseCurriculum(){
  const panel=document.querySelector('[data-curriculum]'); if(!panel) return;
  const p=getProgress();
  let firstNotDone=ALL_LESSONS.findIndex(id=>!p.done[id]); if(firstNotDone<0) firstNotDone=ALL_LESSONS.length;
  // 강의 행: 완료 ✓ / 다음 학습 ▶ / 잠금 🔒
  panel.querySelectorAll('.row[data-clesson]').forEach(row=>{
    const id=row.dataset.clesson, idx=ALL_LESSONS.indexOf(id);
    const done=!!p.done[id], cur=!done && idx===firstNotDone;
    row.classList.remove('done','cur','locked'); row.removeAttribute('data-locked');
    const ck=row.querySelector('.ck');
    if(done){ row.classList.add('done'); if(ck) ck.innerHTML='<i class="icn icn-check"></i>'; row.setAttribute('href','/player?lesson='+id); }
    else if(cur){ row.classList.add('cur'); if(ck) ck.innerHTML='<i class="icn icn-play"></i>'; row.setAttribute('href','/player?lesson='+id); }
    else { row.classList.add('locked'); if(ck) ck.innerHTML='<i class="icn icn-lock"></i>'; row.setAttribute('href','#'); row.setAttribute('data-locked','1'); }
  });
  // 섹션별 진척 바 + 텍스트
  panel.querySelectorAll('.acc[data-sec]').forEach(acc=>{
    const lessons=CURRICULUM[+acc.dataset.sec].lessons;
    const dn=lessons.filter(l=>p.done[l]).length, tot=lessons.length;
    const bar=acc.querySelector('[data-secbar]'), pct=acc.querySelector('[data-secpct]');
    if(bar){ bar.style.width=Math.round(dn/tot*100)+'%'; bar.classList.toggle('done',dn===tot&&tot>0); }
    if(pct) pct.textContent=dn===0?'시작 전':(dn===tot?dn+'/'+tot+' 완료':dn+'/'+tot+' 수강');
    // 섹션 단원평가 상태 배지: 통과 ✓ / 재응시 / 응시 가능
    const ub=acc.querySelector('[data-secbadge]');
    if(ub){ const u=p.units['u'+(+acc.dataset.sec+1)], allDone=dn===tot&&tot>0;
      if(u){ const passed=u.score>=Math.ceil(u.total*0.6);
        ub.hidden=false; ub.className='unitbadge '+(passed?'pass':'retry');
        ub.innerHTML=(passed?'<i class="icn icn-check"></i> 단원평가 통과 ':'단원평가 재응시 ')+u.score+'/'+u.total; }
      else if(allDone){ ub.hidden=false; ub.className='unitbadge ready'; ub.innerHTML='<i class="icn icn-pencil"></i> 단원평가 응시 가능'; }
      else { ub.hidden=true; ub.textContent=''; }
    }
  });
  const cp=panel.querySelector('[data-cur-pct]'); if(cp) cp.textContent=courseProgressPct()+'%';
  // 잠긴 강의 클릭 가드 (1회만 바인딩) — React Router <Link>가 bubble 전에 navigate하므로 capture-phase로 차단
  if(!panel.dataset.guard){ panel.dataset.guard='1';
    panel.addEventListener('click',e=>{
      const lk=e.target.closest('.row[data-locked]'); if(lk){ e.preventDefault(); e.stopPropagation(); toast('이전 강의를 먼저 완료해 주세요'); }
    },true);
  }
}

/* ----- exports ----- */
export { initLesson, initCourseCurriculum, getProgress, saveProgress, recordLessonDone, nextLesson, courseProgressPct, lessonsDone, totalStudyHours, studyStreak, weekDays, heatLevel, quizAvg, unitAvgPct, unitsPassedCount, allUnitsPassed, unitUnlocked, todayStr, ALL_LESSONS, CURRICULUM, LESSONS, LESSON_LIST, UNITS, UNIT_BANK }
