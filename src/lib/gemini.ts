import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
})

export const aiSummariseCommit = async (diff: string) => {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file');
  }
  
  // https://github.com/docker/genai-stack/commit/<commithash>.diff
  const response = await model.generateContent([
    'You are an expert programmer, and you are trying to summarize a git diff.',
    // Reminders about the git diff format:
    // For every file, there are a few metadata lines, like (for example):
    // diff --git a/lib/index.js b/lib/index.js
    // index aadf691..bfef603 100644
    // --- a/lib/index.js
    // +++ b/lib/index.js
    // 
    // lib/index.js was modified.
    // 
    // A line starting with + means it was added.
    // A line starting with - means that line was deleted.
    // A line starting with neither + nor - is code given for context and better understanding, and is not part of the actual diff.
    // 
    // EXAMPLE SUMMARY COMMENTS:
    // * Raised the amount of returned recordings from `10` to `100` [packages/server/recordings_api.ts], [packages/server/constants.ts]
    // * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
    // * Moved the `octokit` initialization to a separate file [src/octokit.ts], [src/index.ts]
    // * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
    // * Lowered numeric tolerance for test files
    // 
    // Most commits will have less comments than this examples list.
    // The last comment does not include the file names,
    // because there were more than two relevant files in the hypothetical commit.
    // Do not include parts of the example in your summary.
    // It is given only as an example of appropriate comments.
    `Please summarise the following diff file: \n\n${diff}`,
  ]);

  return response.response.text();
}

// Test the function with a large sample git diff
const sampleDiff = "diff --git a/app/api/send/route.js b/app/api/send/route.js\n" +
"new file mode 100644\n" +
"index 0000000..2aa409d\n" +
"--- /dev/null\n" +
"+++ b/app/api/send/route.js\n" +
"@@ -0,0 +1,28 @@\n" +
"+import { NextResponse } from \"next/server\";\n" +
"+import { Resend } from \"resend\";\n" +
"+\n" +
"+const resend = new Resend(process.env.RESEND_API_KEY);\n" +
"+const fromEmail = process.env.FROM_EMAIL;\n" +
"+\n" +
"+export async function POST(req, res) {\n" +
"+  const { email, subject, message } = await req.json();\n" +
"+  console.log(email, subject, message);\n" +
"+  try {\n" +
"+    const data = await resend.emails.send({\n" +
"+      from: fromEmail,\n" +
"+      to: [fromEmail, email],\n" +
"+      subject: subject,\n" +
"+      react: (\n" +
"+        <>\n" +
"+          <h1>{subject}</h1>\n" +
"+          <p>Thank you for contacting us!</p>\n" +
"+          <p>New message submitted:</p>\n" +
"+          <p>{message}</p>\n" +
"+        </>\n" +
"+      ),\n" +
"+    });\n" +
"+    return NextResponse.json(data);\n" +
"+  } catch (error) {\n" +
"+    return NextResponse.json({ error });\n" +
"+  }\n" +
"}\n" +
"diff --git a/app/components/AboutSection.jsx b/app/components/AboutSection.jsx\n" +
"index b90dc60..cf10ebd 100644\n" +
"--- a/app/components/AboutSection.jsx\n" +
"+++ b/app/components/AboutSection.jsx\n" +
"@@ -54,8 +54,8 @@ const AboutSection = () => {\n" +
" \n" +
"   return (\n" +
"    <section className='text-white' id='about'>\n" +
"-    <div className='md:grid md:grid-cols-2 gap-8 items-center'>\n" +
"-        <Image src='/images/about-image.png' width={300} height={300} alt='desktop'/>\n" +
"+    <div className='md:grid md:grid-cols-2 gap-8 items-center py-8'>\n" +
"+        <Image src='/images/about-image.png' width={500} height={500} alt='desktop'/>\n" +
"        <div className='mt-4 md:mt-0 text-left flex flex-col h-full'>\n" +
"          <h2 className='text-4xl font-bold text-white mb-4'>About Me</h2>\n" +
"        <p>\n" +
"@@ -90,7 +90,7 @@ const AboutSection = () => {\n" +
"               Certifications{\" \"}\n" +
"             </TabButton>\n" +
"        </div>\n" +
"-        <div className='mt-8'>\n" +
"+        <div className='mt-8 mb-8'>\n" +
"             {TAB_DATA.find((t) => t.id === activeTab).content}\n" +
"        </div>\n" +
"       </div>\n" +
"diff --git a/app/components/EmailSection.jsx b/app/components/EmailSection.jsx\n" +
"index 06b7770..47a8954 100644\n" +
"--- a/app/components/EmailSection.jsx\n" +
"+++ b/app/components/EmailSection.jsx\n" +
"@@ -1,8 +1,123 @@\n" +
"-import React from 'react'\n" +
"+\"use client\"\n" +
"+import React, { useState } from 'react'\n" +
"+import Link from \"next/link\";\n" +
"+import Image from \"next/image\";\n" +
" \n" +
" const EmailSection = () => {\n" +
"+      const [emailSubmitted, setEmailSubmitted] = useState(false);\n" +
"+\n" +
"+      const handleSubmit = async (e) => {\n" +
"+        e.preventDefault();\n" +
"+        const data = {\n" +
"+          email: e.target.email.value,\n" +
"+          subject: e.target.subject.value,\n" +
"+          message: e.target.message.value,\n" +
"+        };\n" +
"+        const JSONdata = JSON.stringify(data);\n" +
"+        const endpoint = \"/api/send\";\n" +
"+        const options = {\n" +
"+          method: \"POST\",\n" +
"+          headers: {\n" +
"+            \"Content-Type\": \"application/json\",\n" +
"+          },\n" +
"+          body: JSONdata,\n" +
"+        };\n" +
"+        const response = await fetch(endpoint, options);\n" +
"+        const resData = await response.json();\n" +
"+        if (response.status === 200) {\n" +
"+            console.log(\"Message sent.\");\n" +
"+          setEmailSubmitted(true);\n" +
"+        }\n" +
"+      };\n" +
"   return (\n" +
"-    <div>EmailSection</div>\n" +
"+   <section\n" +
"+   id='contact'\n" +
"+   className='grid md:grid-cols-2 my-12 md:my-12 py-24 gap-4'>\n" +
"+    {/* description */}\n" +
"+    <div className='z-10'>\n" +
"+        <h5 className='text-2xl mb-2.5 font-extrabold'>Let's connect</h5>\n" +
"+        <p className='text-[#ADB7BE] text-xl  mb-4 max-w-md'>\n" +
"+            {\" \"}\n" +
"+          I&apos;m currently looking for new opportunities, my inbox is always\n" +
"+          open. Whether you have a question or just want to say hi, I&apos;ll\n" +
"+          try my best to get back to you!\n" +
"+        </p>\n" +
"+                   <div className=\"socials flex flex-row gap-2\">\n" +
"+           <Link href=\"github.com\"\n" +
"+           className=''>\n" +
"+             <Image src=\"/github-icon.svg\" alt=\"Github Icon\" width={44} height={44} />\n" +
"+           </Link>\n" +
"+           <Link href=\"linkedin.com\">\n" +
"+             <Image src=\"/linkedin-icon.svg\" alt=\"Linkedin Icon\" width={44} height={44} />\n" +
"+           </Link>\n" +
"+         </div>\n" +
"+    </div>\n" +
"+    {/* form */}\n" +
"+    <div>\n" +
"+        {emailSubmitted ? (\n" +
"+            <p className=\"text-green-500 text-sm mt-2\">\n" +
"+            Email sent successfully!\n" +
"+          </p>\n" +
"+        ) \n" +
"+        : \n" +
"+        (\n" +
"+             <form className=\"flex flex-col\" onSubmit={handleSubmit}>\n" +
"+            <div className=\"mb-6\">\n" +
"+              <label\n" +
"+                htmlFor=\"email\"\n" +
"+                className=\"text-white block mb-2 text-sm font-medium\"\n" +
"+              >\n" +
"+                Your email\n" +
"+              </label>\n" +
"+              <input\n" +
"+                name=\"email\"\n" +
"+                type=\"email\"\n" +
"+                id=\"email\"\n" +
"+                required\n" +
"+                className=\"bg-[#18191E] border border-[#33353F] placeholder-[#9CA2A9] text-gray-100 text-sm rounded-lg block w-full p-2.5\"\n" +
"+                placeholder=\"jacob@google.com\"\n" +
"+              />\n" +
"+            </div>\n" +
"+            <div className=\"mb-6\">\n" +
"+              <label\n" +
"+                htmlFor=\"subject\"\n" +
"+                className=\"text-white block text-sm mb-2 font-medium\"\n" +
"+              >\n" +
"+                Subject\n" +
"+              </label>\n" +
"+              <input\n" +
"+                name=\"subject\"\n" +
"+                type=\"text\"\n" +
"+                id=\"subject\"\n" +
"+                required\n" +
"+                className=\"bg-[#18191E] border border-[#33353F] placeholder-[#9CA2A9] text-gray-100 text-sm rounded-lg block w-full p-2.5\"\n" +
"+                placeholder=\"Just saying hi\"\n" +
"+              />\n" +
"+            </div>\n" +
"+            <div className=\"mb-6\">\n" +
"+              <label\n" +
"+                htmlFor=\"message\"\n" +
"+                className=\"text-white block text-sm mb-2 font-medium\"\n" +
"+              >\n" +
"+                Message\n" +
"+              </label>\n" +
"+              <textarea\n" +
"+                name=\"message\"\n" +
"+                id=\"message\"\n" +
"+                className=\"bg-[#18191E] border border-[#33353F] placeholder-[#9CA2A9] text-gray-100 text-sm rounded-lg block w-full p-2.5\"\n" +
"+                placeholder=\"Let's talk about...\"\n" +
"+              />\n" +
"+            </div>\n" +
"+            <button\n" +
"+              type=\"submit\"\n" +
"+              className=\"bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-5 rounded-lg w-full\"\n" +
"+            >\n" +
"+              Send Message\n" +
"+            </button>\n" +
"+          </form>\n" +
"+        )}\n" +
"+    </div>\n" +
"+   </section>\n" +
"   )\n" +
" }\n" +
" \n" +
"diff --git a/app/components/HeroSection.jsx b/app/components/HeroSection.jsx\n" +
"index e904d2a..a4ded3e 100644\n" +
"--- a/app/components/HeroSection.jsx\n" +
"+++ b/app/components/HeroSection.jsx\n" +
"@@ -2,6 +2,7 @@\n" +
" import Image from 'next/image'\n" +
" import Link from 'next/link'\n" +
" import React from 'react'\n" +
"+import { motion } from \"framer-motion\";\n" +
" \n" +
" import { TypeAnimation } from 'react-type-animation';\n" +
" \n" +
"@@ -10,7 +11,11 @@ const HeroSection = () => {\n" +
"     <section className='lg:py-16'>\n" +
"       <div className='grid grid-cols-1 sm:grid-cols-12'>\n" +
"         {/* Text section */}\n" +
"-        <div className='col-span-8 place-self-center text-center sm:text-left justify-self-start'>\n" +
"+        <motion.div\n" +
"+        initial={{ opacity: 0, scale: 0.5 }}\n" +
"+        animate={{ opacity: 1, scale: 1 }}\n" +
"+        transition={{ duration: 0.5 }}\n" +
"+        className='col-span-8 place-self-center text-center sm:text-left justify-self-start'>\n" +
"           <h1 className='text-white mb-4 text-4xl sm:text-5xl md:text-8xl font-extrabold lg:leading-normal'>\n" +
"             <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600\">\n" +
"               Hello, I&apos;m{\" \"}\n" +
"@@ -54,9 +59,13 @@ const HeroSection = () => {\n" +
"               </span>\n" +
"             </Link>\n" +
"           </div>\n" +
"-        </div>\n" +
"+        </motion.div>\n" +
"         {/* img section */}\n" +
"-        <div className='col-span-4 place-self-center mt-4 md:mt-0'>\n" +
"+        <motion.div\n" +
"+         initial={{ opacity: 0, scale: 0.5 }}\n" +
"+          animate={{ opacity: 1, scale: 1 }}\n" +
"+          transition={{ duration: 0.5 }}\n" +
"+        className='col-span-4 place-self-center mt-4 md:mt-0'>\n" +
"           <div className='rounded-full bg-[#181818] w-[250px] h-[250px] md:w-[400px] md:h-[400px] relative'>\n" +
"               <Image\n" +
"             src=\"/images/hero-img.png\"\n" +
"@@ -67,7 +76,7 @@ const HeroSection = () => {\n" +
"             className='absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 '\n" +
"           />\n" +
"           </div>\n" +
"-        </div>\n" +
"+        </motion.div>\n" +
"       </div>\n" +
"     </section>\n" +
"   )\n" +
"diff --git a/app/components/ProjectCard.jsx b/app/components/ProjectCard.jsx\n" +
"index a0d4ba9..adbf734 100644\n" +
"--- a/app/components/ProjectCard.jsx\n" +
"+++ b/app/components/ProjectCard.jsx\n" +
"@@ -1,19 +1,20 @@\n" +
"-import Link from 'next/link'\n" +
"+import React from \"react\";\n" +
" import { CodeBracketIcon, EyeIcon } from \"@heroicons/react/24/outline\";\n" +
"-import React from 'react'\n" +
"+import Link from \"next/link\";\n" +
" \n" +
" const ProjectCard = ({ imgUrl, title, description, gitUrl, previewUrl }) => {\n" +
"   return (\n" +
"     <div>\n" +
"-      <div className='h-52 md:h-72 rounded-t-xl relative group'\n" +
"-      style={{ background: `url(${imgUrl})`, backgroundSize: \"cover\" }}\n" +
"+      <div\n" +
"+        className=\"h-52 md:h-72 rounded-t-xl relative group\"\n" +
"+        style={{ background: `url(${imgUrl})`, backgroundSize: \"cover\" }}\n" +
"+      >\n" +
"         <div className=\"overlay items-center justify-center absolute top-0 left-0 w-full h-full bg-[#181818] bg-opacity-0 hidden group-hover:flex group-hover:bg-opacity-80 transition-all duration-500 \">\n" +
"           <Link\n" +
"-          href={gitUrl}\n" +
"-          className='h-14 w-14 mr-2 border-2 rounded-full relative border-[#ADB7BE] hover:border-white group/link'\n" +
"+            href={gitUrl}\n" +
"+            className=\"h-14 w-14 mr-2 border-2 relative rounded-full border-[#ADB7BE] hover:border-white group/link\"\n" +
"           >\n" +
"-          <CodeBracketIcon className='h-10 w-10 text-[#ADB7BE] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  cursor-pointer group-hover/link:text-white'/>\n" +
"+            <CodeBracketIcon className=\"h-10 w-10 text-[#ADB7BE] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  cursor-pointer group-hover/link:text-white\" />\n" +
"           </Link>\n" +
"           <Link\n" +
"             href={previewUrl}\n" +
"@@ -22,14 +23,13 @@ const ProjectCard = ({ imgUrl, title, description, gitUrl, previewUrl }) => {\n" +
"             <EyeIcon className=\"h-10 w-10 text-[#ADB7BE] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  cursor-pointer group-hover/link:text-white\" />\n" +
"           </Link>\n" +
"         </div>\n" +
"-\n" +
"       </div>\n" +
"-      <div>\n" +
"-        <h5 className='text-xl font-semibold mb-2'>{title}</h5>\n" +
"-        <p className='text-[#ADB7BE]'>{description}</p>\n" +
"+      <div className=\"text-white rounded-b-xl mt-3 bg-[#181818]py-6 px-4\">\n" +
"+        <h5 className=\"text-xl font-semibold mb-2\">{title}</h5>\n" +
"+        <p className=\"text-[#ADB7BE]\">{description}</p>\n" +
"       </div>\n" +
"     </div>\n" +
"-  )\n" +
"-}\n" +
"+  );\n" +
"+};\n" +
" \n" +
"-export default ProjectCard\n" +
"+export default ProjectCard;\n" +
"diff --git a/app/components/ProjectSection.jsx b/app/components/ProjectSection.jsx\n" +
"index 9261b2e..772ede6 100644\n" +
"--- a/app/components/ProjectSection.jsx\n" +
"+++ b/app/components/ProjectSection.jsx\n" +
"@@ -1,7 +1,8 @@\n" +
" \"use client\";\n" +
"-import React, { useRef, useState } from 'react'\n" +
"-import ProjectTag from './ProjectTag';\n" +
"-import ProjectCard from './ProjectCard';\n" +
"+import React, { useState, useRef } from \"react\";\n" +
"+import ProjectCard from \"./ProjectCard\";\n" +
"+import ProjectTag from \"./ProjectTag\";\n" +
"+import { motion, useInView } from \"framer-motion\";\n" +
" \n" +
" const projectsData = [\n" +
"   {\n" +
"@@ -60,31 +61,36 @@ const projectsData = [\n" +
"   },\n" +
" ];\n" +
" \n" +
"-const ProjectSection = () => {\n" +
"-    const [tag, setTag] = useState(\"All\");\n" +
"+const ProjectsSection = () => {\n" +
"+  const [tag, setTag] = useState(\"All\");\n" +
"   const ref = useRef(null);\n" +
"-  // const isInView = useInView(ref, { once: true });\n" +
"+  const isInView = useInView(ref, { once: true });\n" +
" \n" +
"   const handleTagChange = (newTag) => {\n" +
"     setTag(newTag);\n" +
"   };\n" +
" \n" +
"-    const filteredProjects = projectsData.filter((project) =>\n" +
"+  const filteredProjects = projectsData.filter((project) =>\n" +
"     project.tag.includes(tag)\n" +
"   );\n" +
" \n" +
"+  const cardVariants = {\n" +
"+    initial: { y: 50, opacity: 0 },\n" +
"+    animate: { y: 0, opacity: 1 },\n" +
"+  };\n" +
"+\n" +
"   return (\n" +
"-   <section id='projects'>\n" +
"-    <h2 className='text-center text-4xl font-bold text-white mt-4 mb-8 md:mb-12'>\n" +
"-    My Projects\n" +
"-    </h2>\n" +
"-    <div className='text-white flex justify-center items-center gap-2 py-6'>\n" +
"-    <ProjectTag\n" +
"-    onClick={handleTagChange}\n" +
"-    name=\"All\"\n" +
"-    isSelected={tag === \"All\"}\n" +
"-    />\n" +
"-    <ProjectTag\n" +
"+    <section id=\"projects\">\n" +
"+      <h2 className=\"text-center text-4xl font-bold text-white mt-4 mb-8 md:mb-12\">\n" +
"+        My Projects\n" +
"+      </h2>\n" +
"+      <div className=\"text-white flex flex-row justify-center items-center gap-2 py-6\">\n" +
"+        <ProjectTag\n" +
"+          onClick={handleTagChange}\n" +
"+          name=\"All\"\n" +
"+          isSelected={tag === \"All\"}\n" +
"+        />\n" +
"+        <ProjectTag\n" +
"           onClick={handleTagChange}\n" +
"           name=\"Web\"\n" +
"           isSelected={tag === \"Web\"}\n" +
"@@ -94,11 +100,15 @@ const ProjectSection = () => {\n" +
"           name=\"Mobile\"\n" +
"           isSelected={tag === \"Mobile\"}\n" +
"         />\n" +
"-    </div>\n" +
"-    <ul className='grid md:grid-cols-3 gap-8 md:gap-12'>\n" +
"-      {filteredProjects.map((project, index) => (\n" +
"-          <li\n" +
"+      </div>\n" +
"+      <ul ref={ref} className=\"grid md:grid-cols-3 gap-8 md:gap-12\">\n" +
"+        {filteredProjects.map((project, index) => (\n" +
"+          <motion.li\n" +
"             key={index}\n" +
"+            variants={cardVariants}\n" +
"+            initial=\"initial\"\n" +
"+            animate={isInView ? \"animate\" : \"initial\"}\n" +
"+            transition={{ duration: 0.3, delay: index * 0.4 }}\n" +
"           >\n" +
"             <ProjectCard\n" +
"               key={project.id}\n" +
"@@ -108,11 +118,11 @@ const ProjectSection = () => {\n" +
"               gitUrl={project.gitUrl}\n" +
"               previewUrl={project.previewUrl}\n" +
"             />\n" +
"-          </li>\n" +
"+          </motion.li>\n" +
"         ))}\n" +
"-    </ul>\n" +
"-   </section>\n" +
"-  )\n" +
"-}\n" +
"+      </ul>\n" +
"+    </section>\n" +
"+  );\n" +
"+};\n" +
" \n" +
"-export default ProjectSection\n" +
"+export default ProjectsSection;\n" +
"diff --git a/app/components/TabButton.jsx b/app/components/TabButton.jsx\n" +
"index 4e49d1b..7b2bc73 100644\n" +
"--- a/app/components/TabButton.jsx\n" +
"+++ b/app/components/TabButton.jsx\n" +
"@@ -1,16 +1,26 @@\n" +
"-import React from 'react'\n" +
"+import React from \"react\";\n" +
"+import { motion } from \"framer-motion\";\n" +
"+\n" +
"+const variants = {\n" +
"+  default: { width: 0 },\n" +
"+  active: { width: \"calc(100% - 0.75rem)\" },\n" +
"+};\n" +
"+\n" +
"-const TabButton = ({active,selectTab,children}) => {\n" +
"-    const buttonClass = active ? 'text-white' : 'text-[#ADB7BE]';\n" +
"+const TabButton = ({ active, selectTab, children }) => {\n" +
"+  const buttonClasses = active ? \"text-white\" : \"text-[#ADB7BE]\";\n" +
" \n" +
"   return (\n" +
"     <button onClick={selectTab}>\n" +
"-        <p className={`mr-3 font-semibold hover:text-white ${buttonClass} transition-all duration-300`}\n" +
"-        >{children}</p>\n" +
"-        <div className='h-1 bg-purple-400 mt-2 mr-3'>\n" +
"-            \n" +
"-        </div>\n" +
"+      <p className={`mr-3 font-semibold hover:text-white ${buttonClasses}`}>\n" +
"+        {children}\n" +
"+      </p>\n" +
"+      <motion.div\n" +
"+        animate={active ? \"active\" : \"default\"}\n" +
"+        variants={variants}\n" +
"+        className=\"h-1 bg-primary-500 mt-2 mr-3\"\n" +
"+      ></motion.div>\n" +
"+    </button>\n" +
"-  )\n" +
"-}\n" +
"+  );\n" +
"+};\n" +
" \n" +
"-export default TabButton\n" +
"+export default TabButton;\n" +
"diff --git a/app/globals.css b/app/globals.css\n" +
"index 6ac4ffc..4e79f0e 100644\n" +
"--- a/app/globals.css\n" +
"+++ b/app/globals.css\n" +
"@@ -10,6 +10,17 @@\n" +
"   --color-foreground: var(--foreground);\n" +
"   --font-sans: var(--font-geist-sans);\n" +
"   --font-mono: var(--font-geist-mono);\n" +
"+  --color-primary-50: #faf5ff;\n" +
"+  --color-primary-100: #f3e8ff;\n" +
"+  --color-primary-200: #e9d5ff;\n" +
"+  --color-primary-300: #d8b4fe;\n" +
"+  --color-primary-400: #c084fc;\n" +
"+  --color-primary-500: #a855f7;\n" +
"+  --color-primary-600: #9333ea;\n" +
"+  --color-primary-700: #7c3aed;\n" +
"+  --color-primary-800: #6b21a8;\n" +
"+  --color-primary-900: #581c87;\n" +
"+  --color-primary-950: #3b0764;\n" +
" }\n" +
" \n" +
" @media (prefers-color-scheme: dark) {\n" +
"diff --git a/app/page.js b/app/page.js\n" +
"index e3bacb9..8825097 100644\n" +
"--- a/app/page.js\n" +
"+++ b/app/page.js\n" +
"@@ -3,6 +3,7 @@ import HeroSection from \"./components/HeroSection\";\n" +
" import Navbar from \"./components/Navbar\";\n" +
" import AboutSection from \"./components/AboutSection\";\n" +
" import ProjectSection from \"./components/ProjectSection\";\n" +
"+import EmailSection from \"./components/EmailSection\";\n" +
" \n" +
" export default function Home() {\n" +
"   return (\n" +
"@@ -12,6 +13,7 @@ export default function Home() {\n" +
"         <HeroSection />\n" +
"         <AboutSection/>\n" +
"         <ProjectSection/>\n" +
"+        <EmailSection/>\n" +
"       </div>\n" +
"      \n" +
"     </main>\n" +
"diff --git a/package-lock.json b/package-lock.json\n" +
"index 3969ebd..4cf6cb5 100644\n" +
"--- a/package/lock.json\n" +
"+++ b/package/lock.json\n" +
"@@ -9,6 +9,7 @@\n" +
"       \"version\": \"0.1.0\",\n" +
"       \"dependencies\": {\n" +
"         \"@heroicons/react\": \"^2.2.0\",\n" +
"+        \"framer-motion\": \"^12.23.12\",\n" +
"         \"next\": \"15.4.6\",\n" +
"         \"react\": \"19.1.0\",\n" +
"         \"react-dom\": \"19.1.0\",\n" +
"@@ -3297,6 +3298,33 @@\n" +
"         \"url\": \"https://github.com/sponsors/ljharb\"\n" +
"       }\n" +
"     },\n" +
"+    \"node_modules/framer-motion\": {\n" +
"+      \"version\": \"12.23.12\",\n" +
"+      \"resolved\": \"https://registry.npmjs.org/framer-motion/-/framer-motion-12.23.12.tgz\",\n" +
"+      \"integrity\": \"sha512-6e78rdVtnBvlEVgu6eFEAgG9v3wLnYEboM8I5O5EXvfKC8gxGQB8wXJdhkMy10iVcn05jl6CNw7/HTsTCfwcWg==\",\n" +
"+      \"license\": \"MIT\",\n" +
"+      \"dependencies\": {\n" +
"+        \"motion-dom\": \"^12.23.12\",\n" +
"+        \"motion-utils\": \"^12.23.6\",\n" +
"+        \"tslib\": \"^2.4.0\"\n" +
"+      },\n" +
"+      \"peerDependencies\": {\n" +
"+        \"@emotion/is-prop-valid\": \"*\",\n" +
"+        \"react\": \"^18.0.0 || ^19.0.0\",\n" +
"+        \"react-dom\": \"^18.0.0 || ^19.0.0\"\n" +
"+      },\n" +
"+      \"peerDependenciesMeta\": {\n" +
"+        \"@emotion/is-prop-valid\": {\n" +
"+          \"optional\": true\n" +
"+        },\n" +
"+        \"react\": {\n" +
"+          \"optional\": true\n" +
"+        },\n" +
"+        \"react-dom\": {\n" +
"+          \"optional\": true\"\n" +
"+        }\n" +
"+      }\n" +
"+    },\n" +
"     \"node_modules/function-bind\": {\n" +
"       \"version\": \"1.1.2\",\n" +
"       \"resolved\": \"https://registry.npmjs.org/framer-motion/-/function-bind-1.1.2.tgz\",\n" +
"@@ -4567,6 +4565,21 @@\n" +
"       \"url\": \"https://github.com/sponsors/isaacs\"\n" +
"     },\n" +
"+    \"node_modules/motion-dom\": {\n" +
"+      \"version\": \"12.23.12\",\n" +
"+      \"resolved\": \"https://registry.npmjs.org/motion-dom/-/motion-dom-12.23.12.tgz\",\n" +
"+      \"integrity\": \"sha512-RcR4fvMCTESQBD/uKQe49D5RUeDOokkGRmz4ceaJKDBgHYtZtntC/s2vLvY38gqGaytinij/yi3hMcWVcEF5Kw==\",\n" +
"+      \"license\": \"MIT\",\n" +
"+      \"dependencies\": {\n" +
"+        \"motion-utils\": \"^12.23.6\"\n" +
"+      }\n" +
"+    },\n" +
"+    \"node_modules/motion-utils\": {\n" +
"+      \"version\": \"12.23.6\",\n" +
"+      \"resolved\": \"https://registry.npmjs.org/motion-utils/-/motion-utils-12.23.6.tgz\",\n" +
"+      \"integrity\": \"sha512-eAWoPgr4eFEOFfg2WjIsMoqJTW6Z8MTUCgn/GZ3VRpClWBdnbjryiA3ZSNLyxCTmCQx4RmYX6jX1iWHbenUPNQ==\",\n" +
"+      \"license\": \"MIT\"\n" +
"+    },\n" +
"     \"node_modules/ms\": {\n" +
"       \"version\": \"2.1.3\",\n" +
"       \"resolved\": \"https://registry.npmjs.org/ms/-/ms-2.1.3.tgz\",\n" +
"diff --git a/package.json b/package.json\n" +
"index 4e784b0..0c3093a 100644\n" +
"--- a/package.json\n" +
"+++ b/package.json\n" +
"@@ -10,6 +10,7 @@\n" +
"   },\n" +
"   \"dependencies\": {\n" +
"     \"@heroicons/react\": \"^2.2.0\",\n" +
"+    \"framer-motion\": \"^12.23.12\",\n" +
"     \"next\": \"15.4.6\",\n" +
"     \"react\": \"19.1.0\",\n" +
"     \"react-dom\": \"19.1.0\",\n" +
"@@ -10,6 +10,7 @@\n" +
"   },\n" +
"     \"react-type-animation\": \"^3.2.0\",\n" +
"     \"tailwindcss\": \"^3.4.0\"\n" +
"   }\n" +
" }";

// console.log('Testing aiSummariseCommit function...');
// summariseCommit(sampleDiff)
//   .then(result => {
//     console.log('✅ Summary:', result);
//   })
//   .catch(error => {
//     console.error('❌ Error:', error.message);
//   });
