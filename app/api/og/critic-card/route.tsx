
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // Extract params
    const score = searchParams.get('score') || '??';
    const grade = searchParams.get('grade') || 'Unranked';
    const analysis = searchParams.get('analysis') || 'No analysis provided.';
    const projectName = searchParams.get('project') || 'Miniature Project';
    const imageUrl = searchParams.get('image'); // Optional background image

    // Fonts setup (using standard fonts for speed in Edge)
    // In production, we'd load a custom font file here.

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f172a', // Slate 900
                    color: 'white',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background Image (Blurred) if provided */}
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt="Background"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.3,
                            filter: 'blur(8px)',
                        }}
                    />
                )}

                {/* Content Container */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        border: '4px solid #3b82f6', // Blue border
                        borderRadius: '20px',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        width: '85%',
                        height: '85%',
                        zIndex: 10,
                        position: 'relative',
                    }}
                >
                    {/* Header: Project Name */}
                    <div
                        style={{
                            fontSize: 32,
                            fontWeight: 'bold',
                            color: '#e2e8f0',
                            marginBottom: 20,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                        }}
                    >
                        {projectName}
                    </div>

                    {/* Score Circle */}
                    <div
                        style={{
                            display: 'flex',
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            border: '10px solid #3b82f6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#1e293b',
                            marginBottom: 20,
                            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 96,
                                fontWeight: 900,
                                color: '#60a5fa',
                            }}
                        >
                            {score}
                        </div>
                    </div>

                    {/* Grade Badge */}
                    <div
                        style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '10px 30px',
                            borderRadius: '50px',
                            fontSize: 28,
                            fontWeight: 'bold',
                            marginBottom: 20,
                            textTransform: 'uppercase',
                        }}
                    >
                        {grade}
                    </div>

                    {/* Analysis Quote */}
                    <div
                        style={{
                            fontSize: 24,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            color: '#94a3b8',
                            maxWidth: '90%',
                            lineHeight: 1.4,
                        }}
                    >
                        "{analysis.length > 120 ? analysis.substring(0, 120) + '...' : analysis}"
                    </div>

                    {/* Footer Branding */}
                    <div
                        style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            opacity: 0.8,
                        }}
                    >
                        <span style={{ fontSize: 24 }}>⚖️</span>
                        <span style={{ fontSize: 20, fontWeight: 'bold' }}>AI Paint Critic @ PaintPile</span>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
