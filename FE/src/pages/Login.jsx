import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Form, Input, Button, Checkbox, Card, Alert, message } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import hospitalLogoLarge from "../assets/hospital-logo-large.png";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const onFinish = async (values) => {
        setIsLoading(true);
        setErrorMsg("");

        try {
            const result = await login(values.username, values.password);
            
            if (result.success) {
                message.success("Đăng nhập thành công!");
                navigate(from, { replace: true });
            } else {
                setErrorMsg(result.message);
            }
        } catch {
            setErrorMsg("Có lỗi xảy ra. Vui lòng thử lại!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 relative bg-cover bg-center"
            style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2600&auto=format&fit=crop")',
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] z-0"></div>

            <Card
                className="w-full max-w-md shadow-2xl rounded-xl z-10 border-0"
                bordered={false}
                styles={{ body: { padding: '2.5rem' } }}
            >
                <div className="text-center mb-8">
                    <img
                        src={hospitalLogoLarge}
                        alt="Hospital Logo"
                        className="h-20 mx-auto mb-4 object-contain"
                    />
                    <h2 className="text-2xl font-bold text-slate-800">Bệnh viện Thái An</h2>
                    <p className="text-slate-500">Đăng nhập hệ thống quản lý</p>
                </div>

                {errorMsg && (
                    <Alert
                        message="Lỗi đăng nhập"
                        description={errorMsg}
                        type="error"
                        showIcon
                        className="mb-6"
                    />
                )}

                <Form
                    name="login_form"
                    layout="vertical"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập email hoặc username!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-slate-400" />}
                            placeholder="Email hoặc Username"
                            className="rounded-lg"
                            data-testid="login-username"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-slate-400" />}
                            placeholder="Mật khẩu"
                            className="rounded-lg"
                            data-testid="login-password"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                        </Form.Item>

                        <a className="float-right text-blue-600 hover:text-blue-800 font-medium" href="#">
                            Quên mật khẩu?
                        </a>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full h-12 text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-700 shadow-md"
                            loading={isLoading}
                            icon={!isLoading && <LoginOutlined />}
                            data-testid="login-submit"
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
