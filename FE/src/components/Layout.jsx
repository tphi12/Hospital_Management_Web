import { Outlet } from "react-router-dom";
import { Layout as AntLayout } from "antd";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const { Content, Sider } = AntLayout;

const Layout = () => {
    return (
        <AntLayout style={{ minHeight: "100vh" }}>
            <Sider
                width={260}
                theme="light"
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 50,
                    borderRight: '1px solid #f0f0f0'
                }}
            >
                <Sidebar />
            </Sider>

            <AntLayout style={{ marginLeft: 260, transition: 'all 0.2s' }}>
                <Navbar />
                <Content style={{ margin: '24px 24px', overflow: 'initial' }}>
                    <div style={{ padding: 24, background: '#fff', borderRadius: 8, minHeight: 360 }}>
                        <Outlet />
                    </div>
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default Layout;
