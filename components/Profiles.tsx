import React from 'react';
import { motion } from 'framer-motion';
import { loadImage } from '@/lib/image-loader.ts';
import { useWeddingData } from '@/hooks/useWeddingData';

interface ProfilesProps {
	onModalStateChange: (isOpen: boolean) => void;
}

interface InterviewItem {
	question: string;
	groom?: string;
	bride?: string;
	answer?: string;
}

const Profiles: React.FC<ProfilesProps> = () => {
	const { weddingData } = useWeddingData();
	const interviews: InterviewItem[] = weddingData.profiles.interviews;

	return (
		<section className="w-full flex flex-col items-center bg-[#f8f8f8] px-6">
			<div className="w-full max-w-md">
				{/* 헤더 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					viewport={{ once: true }}
					className="text-center pt-8 pb-10"
				>
					<p className="text-[10px] font-joseon text-gray-400 tracking-[0.4em] uppercase mb-1">
						{weddingData.profiles.label}
					</p>

					<h2 className="text-2xl font-myeongjo text-gray-800 mb-6 leading-tight">
						{weddingData.profiles.title}
					</h2>

					<div className="w-8 h-[1px] bg-gray-200 mx-auto mb-6" />

					<p className="text-sm font-gowoon text-gray-500 leading-relaxed whitespace-pre-line">
						{weddingData.profiles.subtitle}
					</p>
				</motion.div>

				{/* 사진 한 장 */}
				<div className="w-full rounded-2xl overflow-hidden shadow-lg">
					<img
						src={loadImage('wedding-99')}
						alt="신랑과 신부의 웨딩사진"
						className="block w-full h-auto"
					/>
				</div>

				{/* 본문 인터뷰 영역 */}
				<div className="mt-12 space-y-6">
					{interviews.map((interview, index) => (
						<article
							key={`${index}-${interview.question}`}
							className="rounded-3xl bg-white border border-gray-100 px-6 py-8 shadow-sm"
						>
							{/* 질문 */}
							<h3 className="text-base font-myeongjo text-gray-800 leading-relaxed mb-6">
								{interview.question}
							</h3>

							<div className="space-y-7">
								{/* 신랑 답변 */}
								{interview.groom?.trim() && (
									<div>
										<p className="text-[11px] font-joseon text-gray-400 tracking-widest mb-3">
											신랑
										</p>

										<p className="text-[13px] font-nanumsquare text-gray-600 leading-7 whitespace-pre-line break-words">
											{interview.groom}
										</p>
									</div>
								)}

								{/* 신부 답변 */}
								{interview.bride?.trim() && (
									<div>
										<p className="text-[11px] font-joseon text-gray-400 tracking-widest mb-3">
											신부
										</p>

										<p className="text-[13px] font-nanumsquare text-gray-600 leading-7 whitespace-pre-line break-words">
											{interview.bride}
										</p>
									</div>
								)}

								{/* 두 사람의 공통 답변 */}
								{interview.answer?.trim() && (
									<p className="text-[13px] font-nanumsquare text-gray-600 leading-7 whitespace-pre-line break-words">
										{interview.answer}
									</p>
								)}
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default Profiles;